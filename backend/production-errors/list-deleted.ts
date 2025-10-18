import { api } from "encore.dev/api";
import db from "../db";
import type { ProductionError } from "./types";

interface ListDeletedProductionErrorsResponse {
  errors: Array<ProductionError & { deletedAt: Date }>;
}

export const listDeleted = api<void, ListDeletedProductionErrorsResponse>(
  { expose: true, method: "GET", path: "/production-errors/deleted" },
  async () => {
    const rows = await db.queryAll<{
      id: number;
      project_code: string;
      product_code: string;
      error_description: string;
      is_resolved: boolean;
      created_at: Date;
      resolved_at: Date | null;
      deleted_at: Date;
    }>`
      SELECT id, project_code, product_code, error_description, is_resolved, created_at, resolved_at, deleted_at
      FROM production_errors
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;

    return {
      errors: rows.map((row) => ({
        id: row.id,
        projectCode: row.project_code,
        productCode: row.product_code,
        errorDescription: row.error_description,
        isResolved: row.is_resolved,
        createdAt: row.created_at,
        resolvedAt: row.resolved_at || undefined,
        deletedAt: row.deleted_at,
      })),
    };
  }
);
