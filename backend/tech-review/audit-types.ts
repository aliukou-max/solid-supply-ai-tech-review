export interface AuditLogEntry {
  id: number;
  techReviewId: number;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeDescription: string;
  createdAt: Date;
}

export interface CreateAuditLogParams {
  techReviewId: number;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'add' | 'remove' | 'assign' | 'analyze';
  entityType: 'tech_review' | 'component' | 'component_part' | 'photo' | 'error' | 'node' | 'general_notes';
  entityId?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeDescription: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const db = (await import("../db")).default;
  
  await db.exec`
    INSERT INTO tech_review_audit_log (
      tech_review_id, user_id, user_name, action, entity_type,
      entity_id, field_name, old_value, new_value, change_description
    ) VALUES (
      ${params.techReviewId}, ${params.userId}, ${params.userName}, ${params.action},
      ${params.entityType}, ${params.entityId || null}, ${params.fieldName || null},
      ${params.oldValue || null}, ${params.newValue || null}, ${params.changeDescription}
    )
  `;
}
