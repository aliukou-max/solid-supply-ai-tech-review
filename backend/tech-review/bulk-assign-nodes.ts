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
    const now = new Date();
    let updated = 0;

    for (const assignment of req.assignments) {
      await db.exec`
        UPDATE component_parts
        SET 
          selected_node_id = ${assignment.nodeId},
          has_node = true,
          updated_at = ${now}
        WHERE id = ${assignment.componentPartId}
      `;
      updated++;
    }

    return { success: true, updated };
  }
);
