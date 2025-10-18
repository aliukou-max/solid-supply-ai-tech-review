import { api } from "encore.dev/api";
import db from "../db";
import type { ListProductTypePartsRequest, ProductTypePart } from "./types";

export interface ListProductTypePartsResponse {
  parts: ProductTypePart[];
}

export const listParts = api(
  { method: "GET", path: "/product-types/:productTypeId/parts", expose: true },
  async (req: ListProductTypePartsRequest): Promise<ListProductTypePartsResponse> => {
    const parts = await db.queryAll<ProductTypePart>`
      SELECT id, product_type_id AS "productTypeId", name, sort_order AS "sortOrder", created_at AS "createdAt"
      FROM product_type_parts
      WHERE product_type_id = ${req.productTypeId}
      ORDER BY sort_order, name
    `;
    
    return { parts };
  }
);
