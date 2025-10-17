import { api } from "encore.dev/api";
import db from "../db";

interface DeleteProductionErrorsRequest {
  ids: number[];
}

interface DeleteProductionErrorsResponse {
  deletedCount: number;
}

export const deleteErrors = api<DeleteProductionErrorsRequest, DeleteProductionErrorsResponse>(
  { expose: true, method: "DELETE", path: "/production-errors" },
  async (req) => {
    if (req.ids.length === 0) {
      return { deletedCount: 0 };
    }

    const result = await db.exec`
      DELETE FROM production_errors
      WHERE id = ANY(${req.ids})
    `;

    return { deletedCount: req.ids.length };
  }
);
