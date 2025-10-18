import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt, PracticeType } from "./types";

interface ListLessonsParams {
  practiceType?: PracticeType | "all";
}

interface ListLessonsResponse {
  lessons: LessonLearnt[];
}

export const list = api(
  { expose: true, method: "GET", path: "/lessons-learnt" },
  async (params: ListLessonsParams): Promise<ListLessonsResponse> => {
    let query = `
      SELECT 
        id, product_type as "productType", error_description as "errorDescription",
        solution, prevention, ai_suggestion as "aiSuggestion",
        practice_type as "practiceType", error_id as "errorId",
        occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM lessons_learnt
    `;

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.practiceType && params.practiceType !== "all") {
      conditions.push(`practice_type = $${values.length + 1}`);
      values.push(params.practiceType);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY occurrence_count DESC, severity DESC, created_at DESC`;

    const rows = await db.queryAll<LessonLearnt>(query as any, ...values);

    return { lessons: rows };
  }
);
