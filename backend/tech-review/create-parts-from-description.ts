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

    const existingParts = await db.queryAll<{ id: number }>`
      SELECT id
      FROM component_parts
      WHERE tech_review_id = ${techReview.id}
    `;

    if (existingParts.length > 0) {
      throw new Error("Parts already exist. Please delete them first.");
    }

    return {
      success: true,
      partsCreated: 0,
      components: [],
    };
  }
);
