import { api } from "encore.dev/api";
import db from "../db";
import type { LessonLearnt, Severity, PracticeType } from "./types";

interface UpdateLessonParams {
  id: number;
  productType?: string;
  errorDescription?: string;
  solution?: string;
  prevention?: string;
  aiSuggestion?: string;
  practiceType?: PracticeType;
  errorId?: number;
  severity?: Severity;
}

export const update = api<UpdateLessonParams, LessonLearnt>(
  { expose: true, method: "PUT", path: "/lessons-learnt/:id" },
  async (params) => {
    const now = new Date();

    const existing = await db.queryRow<{ id: number }>`
      SELECT id FROM lessons_learnt WHERE id = ${params.id}
    `;

    if (!existing) {
      throw new Error(`Lesson learnt with id ${params.id} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (params.productType !== undefined) {
      updates.push(`product_type = $${updates.length + 1}`);
      values.push(params.productType);
    }
    if (params.errorDescription !== undefined) {
      updates.push(`error_description = $${updates.length + 1}`);
      values.push(params.errorDescription);
    }
    if (params.solution !== undefined) {
      updates.push(`solution = $${updates.length + 1}`);
      values.push(params.solution);
    }
    if (params.prevention !== undefined) {
      updates.push(`prevention = $${updates.length + 1}`);
      values.push(params.prevention || null);
    }
    if (params.aiSuggestion !== undefined) {
      updates.push(`ai_suggestion = $${updates.length + 1}`);
      values.push(params.aiSuggestion || null);
    }
    if (params.practiceType !== undefined) {
      updates.push(`practice_type = $${updates.length + 1}`);
      values.push(params.practiceType || null);
    }
    if (params.errorId !== undefined) {
      updates.push(`error_id = $${updates.length + 1}`);
      values.push(params.errorId || null);
    }
    if (params.severity !== undefined) {
      updates.push(`severity = $${updates.length + 1}`);
      values.push(params.severity);
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push(`updated_at = $${updates.length + 1}`);
    values.push(now);
    values.push(params.id);

    const query = `
      UPDATE lessons_learnt
      SET ${updates.join(", ")}
      WHERE id = $${values.length}
      RETURNING 
        id, product_type as "productType", error_description as "errorDescription",
        solution, prevention, ai_suggestion as "aiSuggestion",
        practice_type as "practiceType", error_id as "errorId",
        occurrence_count as "occurrenceCount", severity,
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    const row = await db.queryRow<LessonLearnt>(query as any, ...values);

    if (!row) {
      throw new Error("Failed to update lesson learnt");
    }

    return row;
  }
);
