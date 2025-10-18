import { api } from "encore.dev/api";
import db from "../db";
import type { ComponentPart } from "./component-part-types";

export interface UpdateComponentPartRequest {
  id: number;
  photoUrl?: string | null;
  hasDone?: boolean;
  hasNode?: boolean;
  hadErrors?: boolean;
  material?: string | null;
  finish?: string | null;
  notes?: string | null;
  selectedNodeId?: string | null;
  drawingCode?: string | null;
  technologicalDescription?: string | null;
  assemblyTechnology?: string | null;
  linkedErrors?: number[];
}

export const updateComponentPart = api(
  { method: "PUT", path: "/tech-reviews/component-parts/:id", expose: true },
  async (req: UpdateComponentPartRequest): Promise<ComponentPart> => {
    const now = new Date();
    
    const result = await db.queryRow<ComponentPart>`
      UPDATE component_parts
      SET 
        photo_url = CASE WHEN ${req.photoUrl !== undefined} THEN ${req.photoUrl} ELSE photo_url END,
        has_done = CASE WHEN ${req.hasDone !== undefined} THEN ${req.hasDone} ELSE has_done END,
        has_node = CASE WHEN ${req.hasNode !== undefined} THEN ${req.hasNode} ELSE has_node END,
        had_errors = CASE WHEN ${req.hadErrors !== undefined} THEN ${req.hadErrors} ELSE had_errors END,
        material = CASE WHEN ${req.material !== undefined} THEN ${req.material} ELSE material END,
        finish = CASE WHEN ${req.finish !== undefined} THEN ${req.finish} ELSE finish END,
        notes = CASE WHEN ${req.notes !== undefined} THEN ${req.notes} ELSE notes END,
        selected_node_id = CASE WHEN ${req.selectedNodeId !== undefined} THEN ${req.selectedNodeId} ELSE selected_node_id END,
        drawing_code = CASE WHEN ${req.drawingCode !== undefined} THEN ${req.drawingCode} ELSE drawing_code END,
        technological_description = CASE WHEN ${req.technologicalDescription !== undefined} THEN ${req.technologicalDescription} ELSE technological_description END,
        assembly_technology = CASE WHEN ${req.assemblyTechnology !== undefined} THEN ${req.assemblyTechnology} ELSE assembly_technology END,
        updated_at = ${now}
      WHERE id = ${req.id}
      RETURNING 
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
    `;
    
    if (!result) {
      throw new Error("Component part not found");
    }

    if (req.linkedErrors !== undefined) {
      await db.exec`
        DELETE FROM component_part_errors
        WHERE component_part_id = ${req.id}
      `;
      
      for (const errorId of req.linkedErrors) {
        await db.exec`
          INSERT INTO component_part_errors (component_part_id, production_error_id, created_at)
          VALUES (${req.id}, ${errorId}, ${now})
        `;
      }
    }
    
    return result;
  }
);
