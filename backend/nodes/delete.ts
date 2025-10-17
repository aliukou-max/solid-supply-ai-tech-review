import { api } from "encore.dev/api";
import db from "../db";
import { nodesBucket } from "./storage";

interface DeleteNodeRequest {
  id: string;
}

interface DeleteNodeResponse {
  success: boolean;
}

export const deleteNode = api<DeleteNodeRequest, DeleteNodeResponse>(
  { expose: true, method: "DELETE", path: "/nodes/:id" },
  async (req) => {
    const result = await db.query`
      SELECT pdf_url FROM nodes WHERE id = ${req.id}
    `;

    const rows = [];
    for await (const row of result) {
      rows.push(row);
    }

    if (rows.length === 0) {
      throw new Error("Node not found");
    }

    const pdfUrl = rows[0].pdf_url;

    try {
      await nodesBucket.remove(pdfUrl);
    } catch (error) {
      console.error("Failed to delete PDF from storage:", error);
    }

    await db.exec`
      DELETE FROM nodes WHERE id = ${req.id}
    `;

    return { success: true };
  }
);
