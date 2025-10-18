CREATE TABLE tech_review_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tech_review_id BIGINT NOT NULL REFERENCES tech_reviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  change_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tech_review_audit_log_tech_review_id ON tech_review_audit_log(tech_review_id);
CREATE INDEX idx_tech_review_audit_log_created_at ON tech_review_audit_log(created_at DESC);
CREATE INDEX idx_tech_review_audit_log_user_id ON tech_review_audit_log(user_id);
