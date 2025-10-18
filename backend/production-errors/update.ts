import { api } from "encore.dev/api";
import db from "../db";
import type { ProductionError } from "./types";

interface UpdateProductionErrorRequest {
  id: number;
  projectCode?: string;
  productCode?: string;
  partName?: string;
  errorDescription: string;
  isResolved: boolean;
}

export const update = api<UpdateProductionErrorRequest, ProductionError>(
  { expose: true, method: "PUT", path: "/production-errors/:id" },
  async (req) => {
    const resolvedAt = req.isResolved ? new Date() : null;

    await db.exec`
      UPDATE production_errors
      SET project_code = ${req.projectCode},
          product_code = ${req.productCode},
          part_name = ${req.partName},
          error_description = ${req.errorDescription},
          is_resolved = ${req.isResolved},
          resolved_at = ${resolvedAt}
      WHERE id = ${req.id}
    `;

    const row = await db.queryRow<{
      id: number;
      project_code: string;
      product_code: string;
      part_name: string | null;
      error_description: string;
      is_resolved: boolean;
      created_at: Date;
      resolved_at: Date | null;
    }>`
      SELECT id, project_code, product_code, part_name, error_description, is_resolved, created_at, resolved_at
      FROM production_errors
      WHERE id = ${req.id}
    `;

    if (!row) {
      throw new Error("Production error not found");
    }

    return {
      id: row.id,
      projectCode: row.project_code,
      productCode: row.product_code,
      partName: row.part_name || undefined,
      errorDescription: row.error_description,
      isResolved: row.is_resolved,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at || undefined,
    };
  }
);
