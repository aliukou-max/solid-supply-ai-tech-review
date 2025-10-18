import { api } from "encore.dev/api";
import db from "../db";
import type { ComponentPart } from "./component-part-types";

export interface ListComponentPartsRequest {
  techReviewId: number;
}

export interface ListComponentPartsResponse {
  parts: ComponentPart[];
}

export const listComponentParts = api(
  { method: "GET", path: "/tech-reviews/:techReviewId/component-parts", expose: true },
  async (req: ListComponentPartsRequest): Promise<ListComponentPartsResponse> => {
    const parts = await db.queryAll<ComponentPart>`
      SELECT 
        id, 
        tech_review_id AS "techReviewId",
        product_type_part_id AS "productTypePartId",
        part_name AS "partName",
        photo_url AS "photoUrl",
        has_done AS "hasDone",
        has_node AS "hasNode",
        had_errors AS "hadErrors",
        material,
        finish,
        notes,
        recommended_node_id AS "recommendedNodeId",
        selected_node_id AS "selectedNodeId",
        drawing_code AS "drawingCode",
        technological_description AS "technologicalDescription",
        assembly_technology AS "assemblyTechnology",
        sort_order AS "sortOrder",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM component_parts
      WHERE tech_review_id = ${req.techReviewId}
      ORDER BY sort_order, part_name
    `;

    for (const part of parts) {
      const errorLinks = await db.queryAll<{ productionErrorId: number }>`
        SELECT production_error_id AS "productionErrorId"
        FROM component_part_errors
        WHERE component_part_id = ${part.id}
      `;
      part.linkedErrors = errorLinks.map(e => e.productionErrorId);
    }
    
    return { parts };
  }
);
