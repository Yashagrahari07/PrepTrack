-- UP
-- Store estimated durations as fractional minutes (e.g. 24.5).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resources' AND column_name = 'est_minutes' AND data_type = 'integer'
  ) THEN
    ALTER TABLE resources ALTER COLUMN est_minutes TYPE NUMERIC(7,1) USING est_minutes::NUMERIC(7,1);
  END IF;
END $$;

ALTER TABLE resources ALTER COLUMN est_minutes SET DEFAULT 30;

-- DOWN
ALTER TABLE resources ALTER COLUMN est_minutes TYPE INT USING est_minutes::int;
ALTER TABLE resources ALTER COLUMN est_minutes SET DEFAULT 30;
