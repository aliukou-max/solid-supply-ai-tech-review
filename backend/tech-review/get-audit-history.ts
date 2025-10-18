import { api } from "encore.dev/api";
import db from "../db";
import type { AuditLogEntry } from "./audit-types";

interface GetAuditHistoryRequest {
  techReviewId: number;
}

interface GetAuditHistoryResponse {
  entries: AuditLogEntry[];
}

export const getAuditHistory = api<GetAuditHistoryRequest, GetAuditHistoryResponse>(
  { method: "GET", path: "/tech-reviews/:techReviewId/audit-history", expose: true },
  async ({ techReviewId }) => {
    const entries = await db.queryAll<AuditLogEntry>`
      SELECT 
        id,
        tech_review_id AS "techReviewId",
        user_id AS "userId",
        user_name AS "userName",
        action,
        entity_type AS "entityType",
        entity_id AS "entityId",
        field_name AS "fieldName",
        old_value AS "oldValue",
        new_value AS "newValue",
        change_description AS "changeDescription",
        created_at AS "createdAt"
      FROM tech_review_audit_log
      WHERE tech_review_id = ${techReviewId}
      ORDER BY created_at DESC
    `;

    return { entries };
  }
);
