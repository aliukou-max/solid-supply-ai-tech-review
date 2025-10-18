import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateProductTypePartRequest, ProductTypePart } from "./types";

export const updatePart = api(
  { method: "PUT", path: "/product-types/parts/:id", expose: true },
  async (req: UpdateProductTypePartRequest): Promise<ProductTypePart> => {
    const updates: string[] = [];
    const values: any[] = [];
    
    updates.push("name = $1");
    values.push(req.name);
    
    if (req.sortOrder !== undefined) {
      updates.push("sort_order = $2");
      values.push(req.sortOrder);
    }
    
    values.push(req.id);
    
    const result = await db.queryRow<ProductTypePart>`
      UPDATE product_type_parts
      SET name = ${req.name}, sort_order = COALESCE(${req.sortOrder}, sort_order)
      WHERE id = ${req.id}
      RETURNING id, product_type_id AS "productTypeId", name, sort_order AS "sortOrder", created_at AS "createdAt"
    `;
    
    if (!result) {
      throw new Error("Product type part not found");
    }
    
    return result;
  }
);
