import { api, APIError } from "encore.dev/api";
import db from "../db";
import { createAuditLog } from "./audit-types";

interface UpdateComponentParams {
  id: number;
  material?: string;
  finish?: string;
  color?: string;
  grainDirection?: string;
  technicalNotes?: string;
  assemblyNotes?: string;
  nodeId?: string;
  photoUrl?: string;
}

// Updates a component's details
export const updateComponent = api<UpdateComponentParams, void>(
  { expose: true, method: "PUT", path: "/tech-reviews/components/:id" },
  async (params) => {
    const { id, ...updates } = params;
    const now = new Date();

    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.material !== undefined) {
      setParts.push(`material = $${values.length + 1}`);
      values.push(updates.material);
    }
    if (updates.finish !== undefined) {
      setParts.push(`finish = $${values.length + 1}`);
      values.push(updates.finish);
    }
    if (updates.color !== undefined) {
      setParts.push(`color = $${values.length + 1}`);
      values.push(updates.color);
    }
    if (updates.grainDirection !== undefined) {
      setParts.push(`grain_direction = $${values.length + 1}`);
      values.push(updates.grainDirection);
    }
    if (updates.technicalNotes !== undefined) {
      setParts.push(`technical_notes = $${values.length + 1}`);
      values.push(updates.technicalNotes);
    }
    if (updates.assemblyNotes !== undefined) {
      setParts.push(`assembly_notes = $${values.length + 1}`);
      values.push(updates.assemblyNotes);
    }
    if (updates.nodeId !== undefined) {
      setParts.push(`node_id = $${values.length + 1}`);
      values.push(updates.nodeId);
    }
    if (updates.photoUrl !== undefined) {
      setParts.push(`photo_url = $${values.length + 1}`);
      values.push(updates.photoUrl);
    }

    if (setParts.length === 0) {
      return;
    }

    setParts.push(`updated_at = $${values.length + 1}`);
    values.push(now);
    values.push(id);

    const oldComponent = await db.queryRow<any>`
      SELECT c.*, tr.id as tech_review_id 
      FROM components c
      JOIN tech_reviews tr ON c.tech_review_id = tr.id
      WHERE c.id = ${id}
    `;

    const query = `UPDATE components SET ${setParts.join(", ")} WHERE id = $${values.length}`;
    await db.rawExec(query, ...values);

    if (oldComponent) {
      const changes: string[] = [];
      if (updates.material !== undefined && updates.material !== oldComponent.material) changes.push(`material: "${oldComponent.material || 'none'}" → "${updates.material || 'none'}"`);
      if (updates.finish !== undefined && updates.finish !== oldComponent.finish) changes.push(`finish: "${oldComponent.finish || 'none'}" → "${updates.finish || 'none'}"`);
      if (updates.color !== undefined && updates.color !== oldComponent.color) changes.push(`color: "${oldComponent.color || 'none'}" → "${updates.color || 'none'}"`);
      if (updates.grainDirection !== undefined && updates.grainDirection !== oldComponent.grain_direction) changes.push(`grain direction: "${oldComponent.grain_direction || 'none'}" → "${updates.grainDirection || 'none'}"`);
      if (updates.technicalNotes !== undefined && updates.technicalNotes !== oldComponent.technical_notes) changes.push('technical notes updated');
      if (updates.assemblyNotes !== undefined && updates.assemblyNotes !== oldComponent.assembly_notes) changes.push('assembly notes updated');
      if (updates.nodeId !== undefined && updates.nodeId !== oldComponent.node_id) changes.push(`node assigned`);
      if (updates.photoUrl !== undefined && updates.photoUrl !== oldComponent.photo_url) changes.push('photo updated');

      if (changes.length > 0) {
        await createAuditLog({
          techReviewId: oldComponent.tech_review_id,
          userId: "system",
          userName: "User",
          action: "update",
          entityType: "component",
          entityId: id.toString(),
          changeDescription: `Component "${oldComponent.name}" updated: ${changes.join(', ')}`,
        });
      }
    }
  }
);
