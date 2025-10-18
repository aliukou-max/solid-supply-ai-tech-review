import { api, APIError } from "encore.dev/api";
import db from "../db";
import type { TechReview, Component, Error as ReviewError, AISuggestion, ComponentPhoto } from "./types";

interface GetTechReviewResponse {
  review: TechReview;
  components: Component[];
  errors: ReviewError[];
  suggestions: AISuggestion[];
}

// Retrieves a complete tech review with all related data
export const get = api<{ productId: string }, GetTechReviewResponse>(
  { expose: true, method: "GET", path: "/tech-reviews/:productId" },
  async ({ productId }) => {
    let review = await db.queryRow<TechReview>`
      SELECT id, product_id as "productId", status, created_at as "createdAt", updated_at as "updatedAt"
      FROM tech_reviews
      WHERE product_id = ${productId}
    `;

    if (!review) {
      const product = await db.queryRow<{ type: string; productTypeId: string | null }>`
        SELECT type, product_type_id as "productTypeId"
        FROM products
        WHERE id = ${productId}
      `;

      if (!product) {
        throw APIError.notFound("product not found");
      }

      const now = new Date();
      const reviewRow = await db.queryRow<{ id: number }>`
        INSERT INTO tech_reviews (product_id, status, created_at, updated_at)
        VALUES (${productId}, 'draft', ${now}, ${now})
        RETURNING id
      `;

      if (!reviewRow) {
        throw new Error("Failed to create tech review");
      }

      const techReviewId = reviewRow.id;

      if (product.productTypeId) {
        const parts = await db.queryAll<{ id: string; name: string; sortOrder: number }>`
          SELECT id, name, sort_order AS "sortOrder"
          FROM product_type_parts
          WHERE product_type_id = ${product.productTypeId}
          ORDER BY sort_order, name
        `;
        
        for (const part of parts) {
          await db.exec`
            INSERT INTO component_parts (
              tech_review_id, product_type_part_id, part_name, sort_order, 
              has_done, has_node, had_errors, created_at, updated_at
            )
            VALUES (
              ${techReviewId}, ${part.id}, ${part.name}, ${part.sortOrder},
              false, false, false, ${now}, ${now}
            )
          `;
        }
      }

      review = {
        id: techReviewId,
        productId: productId,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };
    }

    const components = await db.queryAll<Component>`
      SELECT 
        id, tech_review_id as "techReviewId", name, material, finish, color,
        grain_direction as "grainDirection", technical_notes as "technicalNotes",
        assembly_notes as "assemblyNotes", node_id as "nodeId", photo_url as "photoUrl",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM components
      WHERE tech_review_id = ${review.id}
      ORDER BY created_at ASC
    `;

    for (const component of components) {
      const photos = await db.queryAll<ComponentPhoto>`
        SELECT 
          id, component_id as "componentId", photo_url as "photoUrl",
          display_order as "displayOrder", created_at as "createdAt"
        FROM component_photos
        WHERE component_id = ${component.id}
        ORDER BY display_order ASC
      `;
      component.photos = photos;
    }

    const errors = await db.queryAll<ReviewError>`
      SELECT 
        id, tech_review_id as "techReviewId", component_id as "componentId",
        description, solution, lesson_learnt_id as "lessonLearntId", status,
        created_at as "createdAt", resolved_at as "resolvedAt"
      FROM errors
      WHERE tech_review_id = ${review.id}
      ORDER BY created_at DESC
    `;

    const suggestions = await db.queryAll<AISuggestion>`
      SELECT 
        id, tech_review_id as "techReviewId", error_id as "errorId",
        suggestion, confidence, created_at as "createdAt"
      FROM ai_suggestions
      WHERE tech_review_id = ${review.id}
      ORDER BY created_at DESC
    `;

    return { review, components, errors, suggestions };
  }
);
