import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { Product } from "./types";

// Retrieves a product by ID
export const get = api<{ id: string }, Product>(
  { expose: true, method: "GET", path: "/products/:id" },
  async ({ id }) => {
    const row = await db.queryRow<Product>`
      SELECT 
        p.id, p.project_id as "projectId", p.ss_code as "ssCode", 
        p.name, p.type, p.product_type_id as "productTypeId", p.dimensions, p.has_drawing as "hasDrawing",
        p.drawing_reference as "drawingReference",
        pt.name as "productTypeName",
        p.created_at as "createdAt", p.updated_at as "updatedAt"
      FROM products p
      LEFT JOIN product_types pt ON p.product_type_id = pt.id
      WHERE p.id = ${id}
    `;

    if (!row) {
      throw APIError.notFound("product not found");
    }

    return row;
  }
);
