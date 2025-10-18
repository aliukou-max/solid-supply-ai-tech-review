import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt, Severity, PracticeType } from "./types";

interface CreateLessonParams {
  productType: string;
  errorDescription: string;
  solution: string;
  prevention?: string;
  aiSuggestion?: string;
  practiceType?: PracticeType;
  errorId?: number;
  severity?: Severity;
}

// Creates a new lesson learnt entry
export const create = api<CreateLessonParams, LessonLearnt>(
  { expose: true, method: "POST", path: "/lessons-learnt" },
  async (params) => {
    const now = new Date();
    const severity = params.severity || "medium";

    const row = await db.queryRow<LessonLearnt>`
      INSERT INTO lessons_learnt (
        product_type, error_description, solution, prevention, ai_suggestion,
        practice_type, error_id, severity, created_at, updated_at
      )
      VALUES (
        ${params.productType}, ${params.errorDescription}, ${params.solution},
        ${params.prevention || null}, ${params.aiSuggestion || null},
        ${params.practiceType || null}, ${params.errorId || null},
        ${severity}, ${now}, ${now}
      )
      RETURNING 
        id, product_type as "productType", error_description as "errorDescription",
        solution, prevention, ai_suggestion as "aiSuggestion",
        practice_type as "practiceType", error_id as "errorId",
        occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!row) {
      throw new Error("Failed to create lesson learnt");
    }

    return row;
  }
);
