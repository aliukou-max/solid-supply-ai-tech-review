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

    const now = new Date();
    const result = await db.exec`
      UPDATE production_errors
      SET deleted_at = ${now}
      WHERE id = ANY(${req.ids}) AND deleted_at IS NULL
    `;

    return { deletedCount: req.ids.length };
  }
);
