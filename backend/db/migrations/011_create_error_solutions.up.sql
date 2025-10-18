CREATE TABLE IF NOT EXISTS error_solutions (
  id SERIAL PRIMARY KEY,
  error_id BIGINT NOT NULL,
  solution TEXT NOT NULL,
  practice_type VARCHAR(10) NOT NULL CHECK (practice_type IN ('good', 'bad')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'error_solutions_error_id_fkey'
  ) THEN
    ALTER TABLE error_solutions
    ADD CONSTRAINT error_solutions_error_id_fkey 
    FOREIGN KEY (error_id) REFERENCES production_errors(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_error_solutions_error_id ON error_solutions(error_id);
CREATE INDEX IF NOT EXISTS idx_error_solutions_practice_type ON error_solutions(practice_type);
