-- Add production errors table
CREATE TABLE production_errors (
  id BIGSERIAL PRIMARY KEY,
  project_code TEXT NOT NULL,
  product_code TEXT NOT NULL,
  error_description TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_production_errors_project_code ON production_errors(project_code);
CREATE INDEX idx_production_errors_created_at ON production_errors(created_at);
CREATE INDEX idx_production_errors_is_resolved ON production_errors(is_resolved);
