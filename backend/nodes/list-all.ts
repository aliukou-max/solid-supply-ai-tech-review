import { api } from "encore.dev/api";
import db from "../db";
import type { Node, DrawingFile } from "./types";

interface ListAllNodesResponse {
  nodes: Node[];
}

export const listAll = api<void, ListAllNodesResponse>(
  { expose: true, method: "GET", path: "/nodes/all" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      product_code: string;
      brand_name: string;
      part_name: string;
      description: string;
      pdf_url: string;
      drawing_files: DrawingFile[];
      product_type: string | null;
      created_at: Date;
    }>`
      SELECT id, product_code, brand_name, part_name, description, pdf_url, drawing_files, product_type, created_at
      FROM nodes
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
        drawingFiles: row.drawing_files || [],
        productType: row.product_type || undefined,
        createdAt: row.created_at,
      })),
    };
  }
);
