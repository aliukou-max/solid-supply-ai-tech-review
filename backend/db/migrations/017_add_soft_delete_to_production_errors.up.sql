ALTER TABLE production_errors ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE INDEX idx_production_errors_deleted_at ON production_errors(deleted_at) WHERE deleted_at IS NOT NULL;
