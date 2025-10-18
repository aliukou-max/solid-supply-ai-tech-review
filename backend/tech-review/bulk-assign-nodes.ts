import { api } from "encore.dev/api";
import db from "../db";

interface BulkAssignNodesRequest {
  assignments: Array<{
    componentPartId: number;
    nodeId: string;
  }>;
}

interface BulkAssignNodesResponse {
  success: boolean;
  updated: number;
}

export const bulkAssignNodes = api(
  {
    expose: true,
    method: "POST",
    path: "/tech-review/bulk-assign-nodes",
  },
  async (req: BulkAssignNodesRequest): Promise<BulkAssignNodesResponse> => {
    if (req.assignments.length === 0) {
      return { success: true, updated: 0 };
    }

    const now = new Date();

    await db.exec`
      BEGIN
    `;

    try {
      for (const assignment of req.assignments) {
        await db.exec`
          UPDATE component_parts
          SET 
            selected_node_id = ${assignment.nodeId},
            has_node = true,
            updated_at = ${now}
          WHERE id = ${assignment.componentPartId}
        `;
      }

      await db.exec`
        COMMIT
      `;

      return { success: true, updated: req.assignments.length };
    } catch (error) {
      await db.exec`
        ROLLBACK
      `;
      throw error;
    }
  }
);
