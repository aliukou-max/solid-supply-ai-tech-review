import { api } from "encore.dev/api";
import db from "../db";
import type { Product } from "./types";

interface ListProductsResponse {
  products: Product[];
}

// Retrieves all products for a project
export const listByProject = api<{ projectId: string }, ListProductsResponse>(
  { expose: true, method: "GET", path: "/products/by-project/:projectId" },
  async ({ projectId }) => {
    const rows = await db.queryAll<Product>`
      SELECT 
        p.id, p.project_id as "projectId", p.ss_code as "ssCode", 
        p.name, p.type, p.product_type_id as "productTypeId",
        pt.name as "productTypeName",
        p.dimensions, p.has_drawing as "hasDrawing",
        p.drawing_reference as "drawingReference",
        p.created_at as "createdAt", p.updated_at as "updatedAt"
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.project_id = ${projectId}
      ORDER BY p.created_at DESC
    `;

    return { products: rows };
  }
);
