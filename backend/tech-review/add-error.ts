import { api } from "encore.dev/api";
import db from "../db";

interface AddErrorParams {
  techReviewId: number;
  componentId?: number;
  description: string;
  solution?: string;
}

interface ErrorResponse {
  id: number;
}

// Adds a new error or issue to a tech review
export const addError = api<AddErrorParams, ErrorResponse>(
  { expose: true, method: "POST", path: "/tech-reviews/errors" },
  async (params) => {
    const now = new Date();

    const row = await db.queryRow<{ id: number }>`
      INSERT INTO errors (
        tech_review_id, component_id, description, solution, status, created_at
      )
      VALUES (
        ${params.techReviewId}, ${params.componentId}, ${params.description}, 
        ${params.solution}, 'open', ${now}
      )
      RETURNING id
    `;

    if (!row) {
      throw new Error("Failed to add error");
    }

    return { id: row.id };
  }
);
