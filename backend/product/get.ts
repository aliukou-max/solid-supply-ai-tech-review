import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Product } from "./types";

// Retrieves a product by ID
export const get = api<{ id: string }, Product>(
  { expose: true, method: "GET", path: "/products/:id" },
  async ({ id }) => {
    const row = await db.queryRow<Product>`
      SELECT 
        id, project_id as "projectId", ss_code as "ssCode", 
        name, type, product_type_id as "productTypeId", dimensions, has_drawing as "hasDrawing",
        drawing_reference as "drawingReference",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM products
      WHERE id = ${id}
    `;

    if (!row) {
      throw APIError.notFound("product not found");
    }

    return row;
  }
);
