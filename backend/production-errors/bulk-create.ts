import { api } from "encore.dev/api";
import db from "../db";
import type { ProductionError } from "./types";

interface BulkCreateProductionErrorsRequest {
  errors: Array<{
    projectCode?: string;
    productCode?: string;
    errorDescription: string;
  }>;
}

interface BulkCreateProductionErrorsResponse {
  createdCount: number;
  errors: ProductionError[];
}

export const bulkCreate = api<BulkCreateProductionErrorsRequest, BulkCreateProductionErrorsResponse>(
  { expose: true, method: "POST", path: "/production-errors/bulk" },
  async (req) => {
    const now = new Date();
    const createdErrors: ProductionError[] = [];

    for (const error of req.errors) {
      const result = await db.queryRow<{ id: number }>`
        INSERT INTO production_errors (project_code, product_code, error_description, is_resolved, created_at)
        VALUES (${error.projectCode || ""}, ${error.productCode || ""}, ${error.errorDescription}, FALSE, ${now})
        RETURNING id
      `;

      if (result) {
        createdErrors.push({
          id: result.id,
          projectCode: error.projectCode,
          productCode: error.productCode,
          errorDescription: error.errorDescription,
          isResolved: false,
          createdAt: now,
        });
      }
    }

    return {
      createdCount: createdErrors.length,
      errors: createdErrors,
    };
  }
);
