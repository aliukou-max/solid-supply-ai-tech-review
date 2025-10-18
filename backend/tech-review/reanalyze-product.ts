import { api } from "encore.dev/api";
import db from "../db";

interface ParsedComponent {
  name: string;
  material?: string;
  finish?: string;
  other?: string;
  uncertainTerms?: string[];
}

interface ReanalyzeProductRequest {
  productId: string;
  description: string;
  selectedPartIds?: string[];
}

interface ReanalyzeProductResponse {
  success: boolean;
  componentsUpdated: number;
  aiResponse?: string;
  components: ParsedComponent[];
  warnings: string[];
}

export const reanalyzeProduct = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/reanalyze-product",
  },
  async (req: ReanalyzeProductRequest): Promise<ReanalyzeProductResponse> => {
    const warnings: string[] = [];
    let componentsUpdated = 0;

    try {
      const product = await db.queryRow<{ id: string; type: string; productTypeId: string }>`
        SELECT id, type, product_type_id AS "productTypeId"
        FROM products
        WHERE id = ${req.productId}
      `;

      if (!product) {
        throw new Error("Product not found");
      }

      const techReview = await db.queryRow<{ id: number }>`
        SELECT id FROM tech_reviews WHERE product_id = ${req.productId}
      `;

      if (!techReview) {
        throw new Error("Tech review not found for this product");
      }

      await db.exec`
        UPDATE tech_reviews
        SET general_notes = ${req.description}, updated_at = NOW()
        WHERE id = ${techReview.id}
      `;

      const allowedPartIds = req.selectedPartIds && req.selectedPartIds.length > 0 
        ? new Set(req.selectedPartIds)
        : null;

      if (allowedPartIds && allowedPartIds.size > 0) {
        const createdComponentParts = await db.queryAll<{ id: number; partName: string; productTypePartId: string }>`
          SELECT id, part_name as "partName", product_type_part_id as "productTypePartId"
          FROM component_parts
          WHERE tech_review_id = ${techReview.id}
        `;

        for (const part of createdComponentParts) {
          if (allowedPartIds.has(part.productTypePartId)) {
            await db.exec`
              UPDATE component_parts
              SET has_done = TRUE, updated_at = NOW()
              WHERE id = ${part.id}
            `;
            componentsUpdated++;
          } else {
            await db.exec`
              UPDATE component_parts
              SET has_done = FALSE, updated_at = NOW()
              WHERE id = ${part.id}
            `;
          }
        }

        await db.exec`
          UPDATE tech_reviews
          SET general_notes = NULL, updated_at = NOW()
          WHERE id = ${techReview.id}
        `;
      }

      return {
        success: true,
        componentsUpdated,
        components: [],
        warnings,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save: ${msg}`);
    }
  }
);

