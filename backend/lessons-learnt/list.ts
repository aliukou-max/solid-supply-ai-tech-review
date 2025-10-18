import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt } from "./types";

interface ListLessonsResponse {
  lessons: LessonLearnt[];
}

export const list = api(
  { expose: true, method: "GET", path: "/lessons-learnt" },
  async (): Promise<ListLessonsResponse> => {
    const rows = await db.queryAll<LessonLearnt>`
      SELECT 
        id, product_type as "productType", error_description as "errorDescription",
        solution, occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM lessons_learnt
      ORDER BY occurrence_count DESC, severity DESC, created_at DESC
    `;

    return { lessons: rows };
  }
);
