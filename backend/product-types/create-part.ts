import { api } from "encore.dev/api";
import db from "../db";
import type { CreateProductTypePartRequest, ProductTypePart } from "./types";

export const createPart = api(
  { method: "POST", path: "/product-types/parts", expose: true },
  async (req: CreateProductTypePartRequest): Promise<ProductTypePart> => {
    const id = `PTP-${Date.now()}`;
    const sortOrder = req.sortOrder ?? 0;
    
    const result = await db.queryRow<ProductTypePart>`
      INSERT INTO product_type_parts (id, product_type_id, name, sort_order, created_at)
      VALUES (${id}, ${req.productTypeId}, ${req.name}, ${sortOrder}, NOW())
      RETURNING id, product_type_id AS "productTypeId", name, sort_order AS "sortOrder", created_at AS "createdAt"
    `;
    
    return result!;
  }
);
