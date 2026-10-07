-- UP
-- Rename dsa_sheet_url -> reference_sheet_url, preserving existing user data.
-- Guarded so the file stays idempotent (the runner executes every file on each run).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'dsa_sheet_url'
  ) THEN
    ALTER TABLE user_settings RENAME COLUMN dsa_sheet_url TO reference_sheet_url;
  END IF;
END $$;

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS goal_custom_text VARCHAR(200),
  ADD COLUMN IF NOT EXISTS show_reference_sheet BOOLEAN DEFAULT TRUE;

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS reference_sheet_url VARCHAR(500) DEFAULT 'https://neetcode.io/practice/practice/neetcode150';

-- The renamed column carries 001's old default ('https://leetcode.com');
-- align it with the application default used by new rows.
ALTER TABLE user_settings
  ALTER COLUMN reference_sheet_url SET DEFAULT 'https://neetcode.io/practice/practice/neetcode150';

-- Backfill rows created before these columns/defaults existed.
UPDATE user_settings
SET reference_sheet_url = 'https://neetcode.io/practice/practice/neetcode150'
WHERE reference_sheet_url IS NULL;

UPDATE user_settings
SET show_reference_sheet = TRUE
WHERE show_reference_sheet IS NULL;

-- DOWN
ALTER TABLE user_settings
  ALTER COLUMN reference_sheet_url SET DEFAULT 'https://leetcode.com';

ALTER TABLE user_settings
  DROP COLUMN IF EXISTS goal_type,
  DROP COLUMN IF EXISTS goal_custom_text,
  DROP COLUMN IF EXISTS show_reference_sheet;

-- Restore the original column name (only if the rename had been applied).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'reference_sheet_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'dsa_sheet_url'
  ) THEN
    ALTER TABLE user_settings RENAME COLUMN reference_sheet_url TO dsa_sheet_url;
  END IF;
END $$;
