import { api } from "encore.dev/api";
import db from "../db";

interface RestoreProductionErrorsRequest {
  ids: number[];
}

interface RestoreProductionErrorsResponse {
  restoredCount: number;
}

export const restoreErrors = api<RestoreProductionErrorsRequest, RestoreProductionErrorsResponse>(
  { expose: true, method: "POST", path: "/production-errors/restore" },
  async (req) => {
    if (req.ids.length === 0) {
      return { restoredCount: 0 };
    }

    const result = await db.exec`
      UPDATE production_errors
      SET deleted_at = NULL
      WHERE id = ANY(${req.ids}) AND deleted_at IS NOT NULL
    `;

    return { restoredCount: req.ids.length };
  }
);
