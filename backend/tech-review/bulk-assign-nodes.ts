import { api } from "encore.dev/api";
import db from "../db";
import { createAuditLog } from "./audit-types";

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

      if (req.assignments.length > 0) {
        const firstPart = await db.queryRow<{ tech_review_id: number }>`
          SELECT tech_review_id FROM component_parts WHERE id = ${req.assignments[0].componentPartId}
        `;

        if (firstPart) {
          await createAuditLog({
            techReviewId: firstPart.tech_review_id,
            userId: "system",
            userName: "User",
            action: "assign",
            entityType: "node",
            changeDescription: `Bulk assigned nodes to ${req.assignments.length} component part(s)`,
          });
        }
      }

      return { success: true, updated: req.assignments.length };
    } catch (error) {
      await db.exec`
        ROLLBACK
      `;
      throw error;
    }
  }
);
