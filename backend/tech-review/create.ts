import { api } from "encore.dev/api";
import db from "../db";
import { getComponentTemplates } from "./templates";
import type { TechReview } from "./types";
import type { ProductType } from "../product/types";

interface CreateTechReviewParams {
  productId: string;
  productType: ProductType;
  productTypeId?: string;
}

export const create = api<CreateTechReviewParams, TechReview>(
  { expose: true, method: "POST", path: "/tech-reviews" },
  async (params) => {
    const now = new Date();

    const row = await db.queryRow<{ id: number }>`
      INSERT INTO tech_reviews (product_id, status, created_at, updated_at)
      VALUES (${params.productId}, 'draft', ${now}, ${now})
      RETURNING id
    `;

    if (!row) {
      throw new Error("Failed to create tech review");
    }

    const techReviewId = row.id;

    if (params.productTypeId) {
      const parts = await db.queryAll<{ id: string; name: string; sortOrder: number }>`
        SELECT id, name, sort_order AS "sortOrder"
        FROM product_type_parts
        WHERE product_type_id = ${params.productTypeId}
        ORDER BY sort_order, name
      `;
      
      for (const part of parts) {
        await db.exec`
          INSERT INTO component_parts (
            tech_review_id, product_type_part_id, part_name, sort_order, created_at, updated_at
          )
          VALUES (
            ${techReviewId}, ${part.id}, ${part.name}, ${part.sortOrder}, ${now}, ${now}
          )
        `;
      }
    } else {
      const templates = getComponentTemplates(params.productType);
      
      for (const template of templates) {
        await db.exec`
          INSERT INTO components (
            tech_review_id, name, technical_notes, assembly_notes, created_at, updated_at
          )
          VALUES (
            ${techReviewId}, ${template.name}, ${template.technicalNotes}, 
            ${template.assemblyNotes}, ${now}, ${now}
          )
        `;
      }
    }

    return {
      id: techReviewId,
      productId: params.productId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
  }
);
