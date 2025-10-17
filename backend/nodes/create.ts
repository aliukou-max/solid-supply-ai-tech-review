import { api } from "encore.dev/api";
import { randomBytes } from "crypto";
import db from "../db";
import { nodesBucket } from "./storage";
import type { Node } from "./types";

interface CreateNodeRequest {
  productCode: string;
  brandName: string;
  partName: string;
  description: string;
  pdfData: string;
  pdfFilename: string;
}

interface CreateNodeResponse {
  node: Node;
}

export const create = api<CreateNodeRequest, CreateNodeResponse>(
  { expose: true, method: "POST", path: "/nodes" },
  async (req) => {
    const nodeId = randomBytes(16).toString("hex");
    
    const pdfBuffer = Buffer.from(req.pdfData, "base64");
    const pdfPath = `${nodeId}/${req.pdfFilename}`;
    
    await nodesBucket.upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
    });
    
    const now = new Date();
    
    await db.exec`
      INSERT INTO nodes (id, product_code, brand_name, part_name, description, pdf_url, created_at)
      VALUES (${nodeId}, ${req.productCode}, ${req.brandName}, ${req.partName}, ${req.description}, ${pdfPath}, ${now})
    `;
    
    return {
      node: {
        id: nodeId,
        productCode: req.productCode,
        brandName: req.brandName,
        partName: req.partName,
        description: req.description,
        pdfUrl: pdfPath,
        createdAt: now,
      },
    };
  }
);
