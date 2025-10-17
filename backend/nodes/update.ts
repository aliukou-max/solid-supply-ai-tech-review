import { api } from "encore.dev/api";
import db from "../db";
import type { Node } from "./types";

interface UpdateNodeRequest {
  id: string;
  productCode?: string;
  brandName?: string;
  partName?: string;
  description?: string;
  productType?: string;
}

interface UpdateNodeResponse {
  node: Node;
}

export const update = api<UpdateNodeRequest, UpdateNodeResponse>(
  { expose: true, method: "PATCH", path: "/nodes/:id" },
  async (req) => {
    const node = await db.queryRow`
      SELECT * FROM nodes WHERE id = ${req.id}
    `;

    if (!node) {
      throw new Error("Node not found");
    }

    const productCode = req.productCode ?? node.product_code;
    const brandName = req.brandName ?? node.brand_name;
    const partName = req.partName ?? node.part_name;
    const description = req.description ?? node.description;
    const productType = req.productType !== undefined ? req.productType : node.product_type;

    await db.exec`
      UPDATE nodes
      SET product_code = ${productCode},
          brand_name = ${brandName},
          part_name = ${partName},
          description = ${description},
          product_type = ${productType}
      WHERE id = ${req.id}
    `;

    return {
      node: {
        id: req.id,
        productCode,
        brandName,
        partName,
        description,
        pdfUrl: node.pdf_url,
        productType: productType || undefined,
        createdAt: node.created_at,
      },
    };
  }
);
