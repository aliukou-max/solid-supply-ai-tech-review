import { api } from "encore.dev/api";
import db from "../db";
import { nodesBucket } from "./storage";

interface BatchExtractResponse {
  processedNodes: number;
  totalFiles: number;
  details: Array<{ nodeId: string; fileCount: number }>;
}

export const batchExtractAllDrawings = api<void, BatchExtractResponse>(
  { expose: true, method: "POST", path: "/nodes/batch-extract-drawings" },
  async () => {
    const nodes = await db.queryAll<{ id: string; pdf_url: string }>`
      SELECT id, pdf_url FROM nodes
    `;

    let processedNodes = 0;
    let totalFiles = 0;
    const details: Array<{ nodeId: string; fileCount: number }> = [];

    for (const node of nodes) {
      try {
        const files: Array<{ filename: string; path: string }> = [];
        
        const folderPrefix = node.id;
        
        for await (const obj of nodesBucket.list({ prefix: folderPrefix + '/' })) {
          if (obj.name.endsWith('.pdf')) {
            const filename = obj.name.split('/').pop() || obj.name;
            files.push({
              filename,
              path: obj.name,
            });
          }
        }

        if (files.length > 0) {
          await db.exec`
            UPDATE nodes
            SET drawing_files = ${JSON.stringify(files)}
            WHERE id = ${node.id}
          `;
          
          processedNodes++;
          totalFiles += files.length;
          details.push({ nodeId: node.id, fileCount: files.length });
        }
      } catch (error) {
        console.error(`Failed to process node ${node.id}:`, error);
      }
    }

    return {
      processedNodes,
      totalFiles,
      details,
    };
  }
);
