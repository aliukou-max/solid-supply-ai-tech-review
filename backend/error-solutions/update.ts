import { api } from "encore.dev/api";
import db from "../db";
import type { ErrorSolution } from "./types";

export interface UpdateErrorSolutionRequest {
  id: number;
  solution?: string;
  practiceType?: 'good' | 'bad';
}

export const update = api(
  { method: "PUT", path: "/error-solutions/:id", expose: true },
  async (req: UpdateErrorSolutionRequest): Promise<ErrorSolution> => {
    const now = new Date();

    const row = await db.queryRow<ErrorSolution>`
      UPDATE error_solutions
      SET 
        solution = COALESCE(${req.solution}, solution),
        practice_type = COALESCE(${req.practiceType}, practice_type),
        updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING 
        id,
        error_id AS "errorId",
        solution,
        practice_type AS "practiceType",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    if (!row) {
      throw new Error("Error solution not found");
    }

    return row;
  }
);
