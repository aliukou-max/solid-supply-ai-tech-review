import { api } from "encore.dev/api";
import db from "../db";
import type { Node } from "./types";

interface ListByBrandRequest {
  brandName: string;
}

interface ListByBrandResponse {
  nodes: Node[];
}

export const listByBrand = api<ListByBrandRequest, ListByBrandResponse>(
  { expose: true, method: "GET", path: "/nodes/by-brand" },
  async (req) => {
    const rows = await db.queryAll<{
      id: string;
      product_code: string;
      brand_name: string;
      part_name: string;
      description: string;
      pdf_url: string;
      created_at: Date;
    }>`
      SELECT id, product_code, brand_name, part_name, description, pdf_url, created_at
      FROM nodes
      WHERE brand_name = ${req.brandName}
      ORDER BY created_at DESC
    `;

    return {
      nodes: rows.map((row) => ({
        id: row.id,
        productCode: row.product_code,
        brandName: row.brand_name,
        partName: row.part_name,
        description: row.description,
        pdfUrl: row.pdf_url,
        createdAt: row.created_at,
      })),
    };
  }
);
