CREATE TABLE error_solutions (
  id SERIAL PRIMARY KEY,
  error_id INTEGER NOT NULL REFERENCES production_errors(id) ON DELETE CASCADE,
  solution TEXT NOT NULL,
  practice_type VARCHAR(10) NOT NULL CHECK (practice_type IN ('good', 'bad')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_solutions_error_id ON error_solutions(error_id);
CREATE INDEX idx_error_solutions_practice_type ON error_solutions(practice_type);
