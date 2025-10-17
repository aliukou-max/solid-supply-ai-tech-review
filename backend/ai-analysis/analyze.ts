import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";

const openAIKey = secret("OpenAIKey");

interface AnalyzeErrorParams {
  techReviewId: number;
  errorDescription: string;
  productType: string;
  context?: string;
}

interface AnalyzeErrorResponse {
  suggestions: string[];
}

// Analyzes an error and generates AI-powered improvement suggestions
export const analyze = api<AnalyzeErrorParams, AnalyzeErrorResponse>(
  { expose: true, method: "POST", path: "/ai-analysis/analyze" },
  async (params) => {
    // Get relevant lessons learnt for context
    const lessons = await db.queryAll<{ errorDescription: string; solution: string }>`
      SELECT error_description as "errorDescription", solution
      FROM lessons_learnt
      WHERE product_type = ${params.productType}
      ORDER BY occurrence_count DESC
      LIMIT 5
    `;

    const lessonsContext = lessons
      .map(l => `- Klaida: ${l.errorDescription}\n  Sprendimas: ${l.solution}`)
      .join("\n");

    const prompt = `Tu esi Solid Supply techninės kokybės ekspertas. Analizuok šią problemą ir pateik 1-3 konkrečius patobulinimo pasiūlymus.

Produkto tipas: ${params.productType}
Klaidos aprašymas: ${params.errorDescription}
${params.context ? `Kontekstas: ${params.context}` : ""}

Panašios ankstesnės klaidos ir sprendimai:
${lessonsContext || "Nėra panašių įrašų"}

Pateik 1-3 konkrečius, praktiškus pasiūlymus kaip išvengti šios problemos ateityje.`;

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
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const aiResponse = data.choices?.[0]?.message?.content || "";

      // Parse suggestions from response
      const suggestions = aiResponse
        .split("\n")
        .filter((line: string) => line.match(/^\d+[\.\)]/))
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim());

      // Store suggestions in database
      const now = new Date();
      for (const suggestion of suggestions) {
        await db.exec`
          INSERT INTO ai_suggestions (tech_review_id, suggestion, created_at)
          VALUES (${params.techReviewId}, ${suggestion}, ${now})
        `;
      }

      return { suggestions };
    } catch (error) {
      console.error("AI analysis error:", error);
      return {
        suggestions: [
          "AI analizė laikinai nepasiekiama. Patikrinkite panašias klaidas Lessons Learnt skiltyje.",
        ],
      };
    }
  }
);
