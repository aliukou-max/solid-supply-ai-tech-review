import { api } from "encore.dev/api";
import db from "../db";
import { techReview } from "~encore/clients";
import type { Product, ProductType } from "./types";

interface CreateProductParams {
  projectId: string;
  ssCode: string;
  name: string;
  type: ProductType;
  productTypeId?: string;
  dimensions?: string;
  hasDrawing?: boolean;
  drawingReference?: string;
}

// Creates a new product and automatically generates a tech review card
export const create = api<CreateProductParams, Product>(
  { expose: true, method: "POST", path: "/products" },
  async (params) => {
    const id = `${params.projectId}-${params.ssCode}`;
    const now = new Date();
    const hasDrawing = params.hasDrawing ?? false;

    await db.exec`
      INSERT INTO products (
        id, project_id, ss_code, name, type, product_type_id, dimensions, 
        has_drawing, drawing_reference, created_at, updated_at
      )
      VALUES (
        ${id}, ${params.projectId}, ${params.ssCode}, ${params.name}, 
        ${params.type}, ${params.productTypeId}, ${params.dimensions}, ${hasDrawing}, 
        ${params.drawingReference}, ${now}, ${now}
      )
    `;

    await techReview.create({ 
      productId: id, 
      productType: params.type,
      productTypeId: params.productTypeId 
    });

    return {
      id,
      projectId: params.projectId,
      ssCode: params.ssCode,
      name: params.name,
      type: params.type,
      dimensions: params.dimensions,
      hasDrawing,
      drawingReference: params.drawingReference,
      createdAt: now,
      updatedAt: now,
    };
  }
);
