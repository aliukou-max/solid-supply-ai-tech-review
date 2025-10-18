import { api } from "encore.dev/api";
import db from "../db";
import type { ErrorSolution } from "./types";

export interface ListErrorSolutionsRequest {
  errorId: number;
}

export interface ListErrorSolutionsResponse {
  solutions: ErrorSolution[];
}

export const list = api(
  { method: "GET", path: "/error-solutions/:errorId", expose: true },
  async (req: ListErrorSolutionsRequest): Promise<ListErrorSolutionsResponse> => {
    const solutions = await db.queryAll<ErrorSolution>`
      SELECT 
        id,
        error_id AS "errorId",
        solution,
        practice_type AS "practiceType",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM error_solutions
      WHERE error_id = ${req.errorId}
      ORDER BY created_at DESC
    `;

    return { solutions };
  }
);
