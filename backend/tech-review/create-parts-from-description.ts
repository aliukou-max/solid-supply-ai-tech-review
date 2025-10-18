import { api } from "encore.dev/api";
import db from "../db";
import { analyzeDescription } from "../ai-analysis/analyze";

interface CreatePartsFromDescriptionRequest {
  productId: string;
}

interface CreatePartsFromDescriptionResponse {
  success: boolean;
  partsCreated: number;
  components: Array<{
    name: string;
    material?: string;
    finish?: string;
  }>;
}

export const createPartsFromDescription = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/create-parts-from-description",
  },
  async (req: CreatePartsFromDescriptionRequest): Promise<CreatePartsFromDescriptionResponse> => {
    const techReview = await db.queryRow<{ id: number; generalNotes: string | null }>`
      SELECT id, general_notes as "generalNotes"
      FROM tech_reviews
      WHERE product_id = ${req.productId}
    `;

    if (!techReview) {
      throw new Error("Tech review not found");
    }

    if (!techReview.generalNotes || techReview.generalNotes.trim().length === 0) {
      throw new Error("No description available to create parts from");
    }

    const product = await db.queryRow<{ type: string; productTypeId: string }>`
      SELECT type, product_type_id as "productTypeId"
      FROM products
      WHERE id = ${req.productId}
    `;

    if (!product) {
      throw new Error("Product not found");
    }

    const existingParts = await db.queryAll<{ id: number }>`
      SELECT id
      FROM component_parts
      WHERE tech_review_id = ${techReview.id}
    `;

    if (existingParts.length > 0) {
      await db.exec`
        DELETE FROM component_parts
        WHERE tech_review_id = ${techReview.id}
      `;
    }

    const components = await analyzeDescription(techReview.generalNotes, product.type);

    if (components.length === 0) {
      throw new Error("AI did not find any components in the description");
    }

    let partsCreated = 0;
    const now = new Date();

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      
      const notes = [
        comp.other,
        comp.uncertainTerms?.length ? `⚠ ${comp.uncertainTerms.join(", ")}` : null
      ].filter(Boolean).join(" | ");

      await db.exec`
        INSERT INTO component_parts (
          tech_review_id, part_name, sort_order,
          material, finish, notes,
          has_done, has_node, had_errors,
          created_at, updated_at
        )
        VALUES (
          ${techReview.id}, ${comp.name}, ${i},
          ${comp.material || null}, ${comp.finish || null}, ${notes || null},
          false, false, false,
          ${now}, ${now}
        )
      `;

      partsCreated++;
    }

    return {
      success: true,
      partsCreated,
      components: components.map(c => ({
        name: c.name,
        material: c.material,
        finish: c.finish,
      })),
    };
  }
);
