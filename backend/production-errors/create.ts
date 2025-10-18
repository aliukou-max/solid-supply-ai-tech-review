import { api } from "encore.dev/api";
import db from "../db";
import type { ProductionError } from "./types";

interface CreateProductionErrorRequest {
  projectCode?: string;
  productCode?: string;
  partName?: string;
  errorDescription: string;
}

export const create = api<CreateProductionErrorRequest, ProductionError>(
  { expose: true, method: "POST", path: "/production-errors" },
  async (req) => {
    const now = new Date();
    const result = await db.queryRow<{ id: number }>`
      INSERT INTO production_errors (project_code, product_code, part_name, error_description, is_resolved, created_at)
      VALUES (${req.projectCode}, ${req.productCode}, ${req.partName || null}, ${req.errorDescription}, FALSE, ${now})
      RETURNING id
    `;

    if (!result) {
      throw new Error("Failed to create production error");
    }

    return {
      id: result.id,
      projectCode: req.projectCode,
      productCode: req.productCode,
      partName: req.partName,
      errorDescription: req.errorDescription,
      isResolved: false,
      createdAt: now,
    };
  }
);
