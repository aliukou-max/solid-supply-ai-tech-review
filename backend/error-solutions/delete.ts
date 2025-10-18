import { api } from "encore.dev/api";
import db from "../db";

export interface DeleteErrorSolutionRequest {
  id: number;
}

export const delete_ = api(
  { method: "DELETE", path: "/error-solutions/:id", expose: true },
  async (req: DeleteErrorSolutionRequest): Promise<void> => {
    await db.exec`
      DELETE FROM error_solutions
      WHERE id = ${req.id}
    `;
  }
);
