import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateProductTypeRequest, ProductType } from "./types";

export const update = api(
  { method: "PUT", path: "/product-types/:id", expose: true },
  async (req: UpdateProductTypeRequest): Promise<ProductType> => {
    const result = await db.queryRow<ProductType>`
      UPDATE product_types
      SET name = ${req.name}
      WHERE id = ${req.id}
      RETURNING id, name, created_at AS "createdAt"
    `;
    
    if (!result) {
      throw new Error("Product type not found");
    }
    
    return result;
  }
);
