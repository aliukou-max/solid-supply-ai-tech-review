import { api, APIError } from "encore.dev/api";
import db from "../db";

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

    const query = `UPDATE components SET ${setParts.join(", ")} WHERE id = $${values.length}`;
    await db.rawExec(query, ...values);
  }
);
