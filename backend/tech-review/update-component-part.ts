import { api } from "encore.dev/api";
import db from "../db";
import type { ComponentPart } from "./component-part-types";
import { createAuditLog } from "./audit-types";

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

    const oldPartData = await db.queryRow<any>`
      SELECT * FROM component_parts WHERE id = ${req.id}
    `;
    
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

    if (oldPartData && result) {
      const changes: string[] = [];
      if (req.hasDone !== undefined && req.hasDone !== oldPartData.has_done) changes.push(`marked as ${req.hasDone ? 'done' : 'not done'}`);
      if (req.hasNode !== undefined && req.hasNode !== oldPartData.has_node) changes.push(`node status: ${req.hasNode ? 'has node' : 'no node'}`);
      if (req.hadErrors !== undefined && req.hadErrors !== oldPartData.had_errors) changes.push(`error status: ${req.hadErrors ? 'has errors' : 'no errors'}`);
      if (req.material !== undefined && req.material !== oldPartData.material) changes.push(`material: "${oldPartData.material || 'none'}" → "${req.material || 'none'}"`);
      if (req.finish !== undefined && req.finish !== oldPartData.finish) changes.push(`finish: "${oldPartData.finish || 'none'}" → "${req.finish || 'none'}"`);
      if (req.selectedNodeId !== undefined && req.selectedNodeId !== oldPartData.selected_node_id) changes.push('node assigned');
      if (req.drawingCode !== undefined && req.drawingCode !== oldPartData.drawing_code) changes.push('drawing code updated');
      if (req.technologicalDescription !== undefined) changes.push('technological description updated');
      if (req.assemblyTechnology !== undefined) changes.push('assembly technology updated');
      if (req.linkedErrors !== undefined) changes.push('linked errors updated');

      if (changes.length > 0) {
        await createAuditLog({
          techReviewId: oldPartData.tech_review_id,
          userId: "system",
          userName: "User",
          action: "update",
          entityType: "component_part",
          entityId: req.id.toString(),
          changeDescription: `Part "${oldPartData.part_name}" updated: ${changes.join(', ')}`,
        });
      }
    }
    
    return result;
  }
);
