import { api } from "encore.dev/api";
import db from "../db";
import type { ProductType } from "./types";

interface UpdateProductRequest {
  id: string;
  name: string;
  type: ProductType;
  dimensions?: string;
  drawingReference?: string;
}

export const update = api(
  { expose: true, method: "PUT", path: "/product/:id" },
  async (req: UpdateProductRequest): Promise<void> => {
    await db.exec`
      UPDATE products
      SET 
        name = ${req.name},
        type = ${req.type},
        dimensions = ${req.dimensions || null},
        drawing_reference = ${req.drawingReference || null},
        has_drawing = ${!!req.drawingReference},
        updated_at = NOW()
      WHERE id = ${req.id}
    `;
  }
);
