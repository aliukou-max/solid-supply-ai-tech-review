import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt } from "./types";

interface SuggestForPartRequest {
  partName: string;
  productType: string;
  limit?: number;
}

interface SuggestForPartResponse {
  suggestions: LessonLearnt[];
}

export const suggestForPart = api<SuggestForPartRequest, SuggestForPartResponse>(
  { expose: true, method: "POST", path: "/lessons-learnt/suggest-for-part" },
  async (req): Promise<SuggestForPartResponse> => {
    const limit = req.limit || 10;
    const partNameLower = req.partName.toLowerCase();

    const suggestions = await db.queryAll<LessonLearnt>`
      SELECT 
        id, 
        product_type as "productType", 
        error_description as "errorDescription", 
        solution, 
        occurrence_count as "occurrenceCount", 
        severity, 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      FROM lessons_learnt
      WHERE 
        product_type = ${req.productType}
      ORDER BY occurrence_count DESC, created_at DESC
      LIMIT ${limit}
    `;

    const filtered = suggestions.filter(lesson => {
      const descLower = lesson.errorDescription.toLowerCase();
      return descLower.includes(partNameLower) || 
             partNameLower.split(' ').some(word => word.length > 3 && descLower.includes(word));
    });

    return {
      suggestions: filtered.length > 0 ? filtered : suggestions.slice(0, 5),
    };
  }
);
