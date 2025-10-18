ALTER TABLE lessons_learnt 
  ADD COLUMN IF NOT EXISTS practice_type VARCHAR(10) CHECK (practice_type IN ('good', 'bad'));

ALTER TABLE lessons_learnt
  ADD COLUMN IF NOT EXISTS prevention TEXT;

ALTER TABLE lessons_learnt
  ADD COLUMN IF NOT EXISTS ai_suggestion TEXT;

ALTER TABLE lessons_learnt
  ADD COLUMN IF NOT EXISTS error_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_learnt_error_id_fkey'
  ) THEN
    ALTER TABLE lessons_learnt
    ADD CONSTRAINT lessons_learnt_error_id_fkey 
    FOREIGN KEY (error_id) REFERENCES production_errors(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lessons_learnt_practice_type ON lessons_learnt(practice_type);
CREATE INDEX IF NOT EXISTS idx_lessons_learnt_error_id ON lessons_learnt(error_id);
