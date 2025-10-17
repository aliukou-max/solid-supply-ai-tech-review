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
        id, project_id as "projectId", ss_code as "ssCode", 
        name, type, dimensions, has_drawing as "hasDrawing",
        drawing_reference as "drawingReference",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM products
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC
    `;

    return { products: rows };
  }
);
