import { api } from "encore.dev/api";
import db from "../db";
import type { ComponentPart } from "./component-part-types";

export interface UpdateComponentPartRequest {
  id: number;
  photoUrl?: string;
  hasDone?: boolean;
  hasNode?: boolean;
  hadErrors?: boolean;
  material?: string;
  finish?: string;
  notes?: string;
  selectedNodeId?: string;
  drawingCode?: string;
  technologicalDescription?: string;
  assemblyTechnology?: string;
  linkedErrorIds?: number[];
}

export const updateComponentPart = api(
  { method: "PUT", path: "/tech-reviews/component-parts/:id", expose: true },
  async (req: UpdateComponentPartRequest): Promise<ComponentPart> => {
    const now = new Date();
    
    const result = await db.queryRow<ComponentPart>`
      UPDATE component_parts
      SET 
        photo_url = COALESCE(${req.photoUrl}, photo_url),
        has_done = COALESCE(${req.hasDone}, has_done),
        has_node = COALESCE(${req.hasNode}, has_node),
        had_errors = COALESCE(${req.hadErrors}, had_errors),
        material = COALESCE(${req.material}, material),
        finish = COALESCE(${req.finish}, finish),
        notes = COALESCE(${req.notes}, notes),
        selected_node_id = COALESCE(${req.selectedNodeId}, selected_node_id),
        drawing_code = COALESCE(${req.drawingCode}, drawing_code),
        technological_description = COALESCE(${req.technologicalDescription}, technological_description),
        assembly_technology = COALESCE(${req.assemblyTechnology}, assembly_technology),
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

    if (req.linkedErrorIds !== undefined) {
      await db.exec`
        DELETE FROM component_part_errors
        WHERE component_part_id = ${req.id}
      `;
      
      for (const errorId of req.linkedErrorIds) {
        await db.exec`
          INSERT INTO component_part_errors (component_part_id, production_error_id, created_at)
          VALUES (${req.id}, ${errorId}, ${now})
        `;
      }
    }
    
    return result;
  }
);
