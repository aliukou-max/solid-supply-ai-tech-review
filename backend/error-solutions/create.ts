import { api } from "encore.dev/api";
import db from "../db";
import type { ErrorSolution } from "./types";

export interface CreateErrorSolutionRequest {
  errorId: number;
  solution: string;
  practiceType: 'good' | 'bad';
}

export const create = api(
  { method: "POST", path: "/error-solutions", expose: true },
  async (req: CreateErrorSolutionRequest): Promise<ErrorSolution> => {
    const now = new Date();

    const row = await db.queryRow<ErrorSolution>`
      INSERT INTO error_solutions (error_id, solution, practice_type, created_at, updated_at)
      VALUES (${req.errorId}, ${req.solution}, ${req.practiceType}, ${now}, ${now})
      RETURNING 
        id,
        error_id AS "errorId",
        solution,
        practice_type AS "practiceType",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    if (!row) {
      throw new Error("Failed to create error solution");
    }

    return row;
  }
);
