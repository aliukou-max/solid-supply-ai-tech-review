import { api } from "encore.dev/api";
import db from "../db";
import type { ProductionError } from "./types";

interface ListByProductRequest {
  projectCode: string;
  productCode: string;
}

interface ListByProductResponse {
  errors: ProductionError[];
}

export const listByProduct = api<ListByProductRequest, ListByProductResponse>(
  { expose: true, method: "GET", path: "/production-errors/by-product" },
  async (req) => {
    const rows = await db.queryAll<{
      id: number;
      project_code: string;
      product_code: string;
      error_description: string;
      is_resolved: boolean;
      created_at: Date;
      resolved_at: Date | null;
    }>`
      SELECT id, project_code, product_code, error_description, is_resolved, created_at, resolved_at
      FROM production_errors
      WHERE project_code = ${req.projectCode} AND product_code = ${req.productCode}
      ORDER BY created_at DESC
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
      })),
    };
  }
);
