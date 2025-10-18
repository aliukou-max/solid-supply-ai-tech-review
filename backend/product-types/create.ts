import { api } from "encore.dev/api";
import db from "../db";
import type { CreateProductTypeRequest, ProductType } from "./types";

export const create = api(
  { method: "POST", path: "/product-types", expose: true },
  async (req: CreateProductTypeRequest): Promise<ProductType> => {
    const id = `PT-${Date.now()}`;
    
    const result = await db.queryRow<ProductType>`
      INSERT INTO product_types (id, name, created_at)
      VALUES (${id}, ${req.name}, NOW())
      RETURNING id, name, created_at AS "createdAt"
    `;
    
    return result!;
  }
);
