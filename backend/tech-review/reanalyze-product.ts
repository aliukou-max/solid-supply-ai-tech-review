import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";

const openAIKey = secret("OpenAIKey");

interface ParsedComponent {
  name: string;
  material?: string;
  finish?: string;
  other?: string;
  uncertainTerms?: string[];
}

interface ReanalyzeProductRequest {
  productId: string;
  description: string;
  selectedPartIds?: string[];
}

interface ReanalyzeProductResponse {
  success: boolean;
  componentsUpdated: number;
  aiResponse?: string;
  components: ParsedComponent[];
  warnings: string[];
}

export const reanalyzeProduct = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/reanalyze-product",
  },
  async (req: ReanalyzeProductRequest): Promise<ReanalyzeProductResponse> => {
    const warnings: string[] = [];
    let componentsUpdated = 0;

    try {
      const product = await db.queryRow<{ id: string; type: string; productTypeId: string }>`
        SELECT id, type, product_type_id AS "productTypeId"
        FROM products
        WHERE id = ${req.productId}
      `;

      if (!product) {
        throw new Error("Product not found");
      }

      const techReview = await db.queryRow<{ id: number }>`
        SELECT id FROM tech_reviews WHERE product_id = ${req.productId}
      `;

      if (!techReview) {
        throw new Error("Tech review not found for this product");
      }

      const analysisResult = await analyzeDescriptionWithAI(req.description, product.productTypeId);
      
      if (!analysisResult.components || analysisResult.components.length === 0) {
        warnings.push("AI did not return any components");
      }

      const createdComponentParts = await db.queryAll<{ id: number; partName: string; productTypePartId: string }>`
        SELECT id, part_name as "partName", product_type_part_id as "productTypePartId"
        FROM component_parts
        WHERE tech_review_id = ${techReview.id}
      `;

      await db.exec`
        UPDATE tech_reviews
        SET general_notes = ${req.description}, updated_at = NOW()
        WHERE id = ${techReview.id}
      `;

      const allowedPartIds = req.selectedPartIds && req.selectedPartIds.length > 0 
        ? new Set(req.selectedPartIds)
        : null;

      for (const comp of analysisResult.components || []) {
        const matchingPart = createdComponentParts.find(p => {
          const nameMatch = p.partName.toLowerCase().includes(comp.name.toLowerCase()) ||
                           comp.name.toLowerCase().includes(p.partName.toLowerCase());
          
          const isAllowed = !allowedPartIds || allowedPartIds.has(p.productTypePartId);
          
          return nameMatch && isAllowed;
        });

        if (matchingPart) {
          const notes = [
            comp.other,
            comp.uncertainTerms?.length ? `⚠ ${comp.uncertainTerms.join(", ")}` : null
          ].filter(Boolean).join(" | ");

          await db.exec`
            UPDATE component_parts
            SET 
              material = ${comp.material || null},
              finish = ${comp.finish || null},
              notes = ${notes || null},
              updated_at = NOW()
            WHERE id = ${matchingPart.id}
          `;

          componentsUpdated++;
          console.log(`✓ AI matched "${comp.name}" → "${matchingPart.partName}": ${comp.material}, ${comp.finish}`);
        } else {
          warnings.push(`AI found "${comp.name}", but no matching component part found`);
        }

        if (comp.uncertainTerms?.length) {
          warnings.push(`"${comp.name}" has uncertain terms: ${comp.uncertainTerms.join(", ")}`);
        }
      }

      return {
        success: true,
        componentsUpdated,
        aiResponse: analysisResult.rawResponse,
        components: analysisResult.components || [],
        warnings,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to reanalyze product: ${msg}`);
    }
  }
);

interface AIAnalysisResult {
  components: ParsedComponent[];
  rawResponse?: string;
}

async function analyzeDescriptionWithAI(description: string, productType: string): Promise<AIAnalysisResult> {
  const apiKey = openAIKey();
  
  if (!apiKey) {
    console.error("OpenAI API key not configured");
    return { 
      components: [],
      rawResponse: "NO_API_KEY"
    };
  }
  
  if (!description || description.trim().length === 0) {
    console.log("Empty description provided to AI");
    return {
      components: [],
      rawResponse: "EMPTY_DESCRIPTION"
    };
  }

  const prompt = `
You are an expert in furniture and retail fixture engineering.
Parse the following technical description into structured component data.

Product Type: ${productType}
Description: ${description}

For each distinct component, extract:
- "name" (e.g. Carcass, Header, Shelves, Back panel, Wall cladding)
- "material" (MDF, marble, HPL, steel, acrylic, etc.)
- "finish" (brushed, polished, satin, painted, etc.)
- "other" (any technical details like thickness, LED, dimensions, grain direction)
If something is unclear or ambiguous, include it in "uncertainTerms".

Also detect dimensions like "2815 x 582mm H2002mm" and include them in "other".

Respond ONLY with valid JSON array format:
[
  {
    "name": "component name",
    "material": "material name or null",
    "finish": "finish description or null", 
    "other": "other technical details or null",
    "uncertainTerms": ["list", "of", "unclear", "terms"] or null
  }
]

If the description is too vague or empty, return an empty array: []
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return { 
        components: [],
        rawResponse: `ERROR_${response.status}: ${errorText.slice(0, 200)}`
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("OpenAI returned empty response");
      return { 
        components: [],
        rawResponse: "EMPTY_AI_RESPONSE"
      };
    }

    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        console.error("AI response not an array:", content.slice(0, 200));
        return { 
          components: [],
          rawResponse: content
        };
      }
      return {
        components: parsed,
        rawResponse: content
      };
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content.slice(0, 200));
      return { 
        components: [],
        rawResponse: content
      };
    }
  } catch (error) {
    console.error("AI analysis error:", error);
    return { 
      components: [],
      rawResponse: `NETWORK_ERROR: ${error}`
    };
  }
}
