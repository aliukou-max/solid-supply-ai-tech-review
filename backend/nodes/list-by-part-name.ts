import { api } from "encore.dev/api";
import db from "../db";
import type { Node } from "./types";

interface ListByPartNameRequest {
  partName: string;
}

interface ListByPartNameResponse {
  nodes: Node[];
}

export const listByPartName = api<ListByPartNameRequest, ListByPartNameResponse>(
  { expose: true, method: "GET", path: "/nodes/by-part/:partName" },
  async (req) => {
    const result = await db.query`
      SELECT id, product_code, brand_name, part_name, description, pdf_url, product_type, created_at
      FROM nodes
      WHERE part_name = ${req.partName}
      ORDER BY brand_name, created_at DESC
    `;

    const nodes: Node[] = [];
    for await (const row of result) {
      nodes.push({
        id: row.id,
        productCode: row.product_code,
        brandName: row.brand_name,
        partName: row.part_name,
        description: row.description,
        pdfUrl: row.pdf_url,
        productType: row.product_type || undefined,
        createdAt: row.created_at,
      });
    }

    return { nodes };
  }
);
