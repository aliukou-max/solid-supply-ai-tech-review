import { api } from "encore.dev/api";
import db from "../db";
import type { ProductType } from "./types";

export interface ListProductTypesResponse {
  productTypes: ProductType[];
}

export const list = api(
  { method: "GET", path: "/product-types", expose: true },
  async (): Promise<ListProductTypesResponse> => {
    const productTypes = await db.queryAll<ProductType>`
      SELECT id, name, created_at AS "createdAt"
      FROM product_types
      ORDER BY name
    `;
    
    return { productTypes };
  }
);
