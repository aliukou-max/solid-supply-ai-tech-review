import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt } from "./types";

interface ListLessonsResponse {
  lessons: LessonLearnt[];
}

// Retrieves lessons learnt for a specific product type, ordered by occurrence count
export const listByType = api<{ productType: string }, ListLessonsResponse>(
  { expose: true, method: "GET", path: "/lessons-learnt/by-type/:productType" },
  async ({ productType }) => {
    const rows = await db.queryAll<LessonLearnt>`
      SELECT 
        id, product_type as "productType", error_description as "errorDescription",
        solution, occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM lessons_learnt
      WHERE product_type = ${productType}
      ORDER BY occurrence_count DESC, severity DESC
    `;

    return { lessons: rows };
  }
);
