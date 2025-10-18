import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

const openAIKey = secret("OpenAIKey");

export interface ParsedComponent {
  name: string;
  material?: string;
  finish?: string;
  other?: string;
  uncertainTerms?: string[];
}

interface AnalyzeRequest {
  description: string;
  productType: string;
}

interface AnalyzeResponse {
  components: ParsedComponent[];
  usedFallback: boolean;
}

export const analyze = api(
  { method: "POST", path: "/ai-analysis/analyze", expose: true },
  async (req: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const components = await analyzeDescription(req.description, req.productType);
    return {
      components,
      usedFallback: false,
    };
  }
);

export async function analyzeDescription(description: string, productType: string): Promise<ParsedComponent[]> {
  if (!description || description.trim().length === 0) return [];

  try {
    console.log(`🧠 Analyzing description for ${productType}`);

    const safeDesc = description.slice(0, 4000);
    const prompt = `
You are a furniture manufacturing technologist. 
Analyze the following description and return structured JSON.

Product Type: ${productType}
Description: ${safeDesc}

Return JSON array of components:
[
  {
    "name": "component name",
    "material": "material name",
    "finish": "surface finish",
    "other": "extra details",
    "uncertainTerms": []
  }
]
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ OpenAI API error:", text);
      return analyzeLocally(description);
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("✅ AI response:", content);

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      return analyzeLocally(description);
    } catch {
      console.warn("⚠️ Invalid JSON from AI, fallback activated");
      return analyzeLocally(description);
    }
  } catch (err: any) {
    console.error("🚨 AI analysis failed:", err.message);
    return analyzeLocally(description);
  }
}

function analyzeLocally(description: string): ParsedComponent[] {
  console.log("🧩 Using local analysis fallback");
  const lower = description.toLowerCase();

  const components = ["carcass", "shelf", "drawer", "door", "panel", "plinth", "frame", "top", "back", "side"];
  const materials = ["mdf", "hpl", "steel", "marble", "veneer", "acrylic", "mirror", "glass", "brass"];
  const finishes = ["brushed", "polished", "matt", "painted", "lacquered", "anodized"];

  const foundC = components.filter(c => lower.includes(c));
  const foundM = materials.filter(m => lower.includes(m));
  const foundF = finishes.filter(f => lower.includes(f));

  return foundC.map(c => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    material: foundM.join(", ") || "Unknown",
    finish: foundF.join(", ") || "Unspecified",
    other: "Auto-parsed (local fallback)",
    uncertainTerms: [],
  }));
}
