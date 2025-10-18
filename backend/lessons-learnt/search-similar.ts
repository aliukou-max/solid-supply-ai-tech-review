import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt } from "./types";

interface SearchSimilarLessonsParams {
  productType: string;
  errorDescription: string;
  limit?: number;
}

interface SearchSimilarLessonsResponse {
  lessons: LessonLearnt[];
}

export const searchSimilar = api<SearchSimilarLessonsParams, SearchSimilarLessonsResponse>(
  { expose: true, method: "POST", path: "/lessons-learnt/search-similar" },
  async ({ productType, errorDescription, limit = 5 }) => {
    if (!errorDescription || errorDescription.trim().length < 3) {
      return { lessons: [] };
    }

    const searchTerms = errorDescription.trim().toLowerCase().split(/\s+/);
    const conditions = searchTerms.map(() => `(LOWER(error_description) LIKE $1 OR LOWER(solution) LIKE $1)`);
    
    const rows = await db.queryAll<LessonLearnt>`
      SELECT 
        id, product_type as "productType", error_description as "errorDescription",
        solution, occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM lessons_learnt
      WHERE product_type = ${productType}
        AND (
          LOWER(error_description) ILIKE ${`%${errorDescription.toLowerCase()}%`}
          OR LOWER(solution) ILIKE ${`%${errorDescription.toLowerCase()}%`}
        )
      ORDER BY occurrence_count DESC, severity DESC
      LIMIT ${limit}
    `;

    return { lessons: rows };
  }
);
