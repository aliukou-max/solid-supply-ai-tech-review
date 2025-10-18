import { api } from "encore.dev/api";
import db from "../db";
import { nodesBucket } from "./storage";

interface ExtractDrawingsRequest {
  nodeId: string;
}

interface ExtractDrawingsResponse {
  extractedCount: number;
  files: Array<{ filename: string; path: string }>;
}

export const extractAndStoreDrawings = api<ExtractDrawingsRequest, ExtractDrawingsResponse>(
  { expose: true, method: "POST", path: "/nodes/:nodeId/extract-drawings" },
  async ({ nodeId }) => {
    const node = await db.queryRow<{ pdf_url: string }>`
      SELECT pdf_url FROM nodes WHERE id = ${nodeId}
    `;

    if (!node) {
      throw new Error("Node not found");
    }

    const pdfUrl = node.pdf_url;
    const files: Array<{ filename: string; path: string }> = [];

    try {
      const attrs = await nodesBucket.list({ prefix: pdfUrl, recursive: true });
      
      for await (const obj of attrs.objects) {
        if (obj.key.endsWith('.pdf')) {
          const filename = obj.key.split('/').pop() || obj.key;
          files.push({
            filename,
            path: obj.key,
          });
        }
      }

      await db.exec`
        UPDATE nodes
        SET drawing_files = ${JSON.stringify(files)}
        WHERE id = ${nodeId}
      `;

      return {
        extractedCount: files.length,
        files,
      };
    } catch (error) {
      console.error("Failed to extract drawings:", error);
      throw error;
    }
  }
);
