import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import OpenAI from "openai";

const openAIKey = secret("OpenAIKey");

interface SuggestAISolutionRequest {
  errorType: string;
  errorDescription: string;
  productType?: string;
  projectName?: string;
  partName?: string;
}

interface SuggestAISolutionResponse {
  suggestion: string;
  prevention: string;
}

export const suggestAISolution = api(
  { expose: true, method: "POST", path: "/lessons-learnt/suggest-ai-solution" },
  async (req: SuggestAISolutionRequest): Promise<SuggestAISolutionResponse> => {
    const openai = new OpenAI({ apiKey: openAIKey() });

    const context = [
      `Error Type: ${req.errorType}`,
      `Error Description: ${req.errorDescription}`,
      req.productType ? `Product Type: ${req.productType}` : null,
      req.projectName ? `Project: ${req.projectName}` : null,
      req.partName ? `Part: ${req.partName}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `You are a manufacturing quality expert analyzing production errors for furniture and cabinet manufacturing.

Given the following error information:
${context}

Please provide:
1. SOLUTION: A specific, actionable solution to fix this error (2-3 sentences)
2. PREVENTION: Concrete preventive measures to avoid this error in future projects (2-3 bullet points)

Format your response as JSON:
{
  "solution": "...",
  "prevention": "..."
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a manufacturing quality expert specializing in furniture and cabinet production. Provide practical, actionable advice based on industry best practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Empty response from OpenAI");
      }

      const parsed = JSON.parse(responseText);
      
      return {
        suggestion: parsed.solution || "No solution provided",
        prevention: parsed.prevention || "No prevention measures provided"
      };

    } catch (error) {
      console.error("AI suggestion error:", error);
      throw new Error(`Failed to generate AI suggestion: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
