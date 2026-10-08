-- UP
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS position INT DEFAULT 0;

ALTER TABLE resources
  ALTER COLUMN position SET DEFAULT 0;

-- Backfill only untouched topics (all rows still 0), oldest first.
-- Guarded so re-running never clobbers user-defined order.
UPDATE resources r SET position = ranked.rn - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY topic_id ORDER BY created_at ASC, id ASC) AS rn
  FROM resources
) ranked
WHERE r.id = ranked.id
  AND r.position = 0
  AND NOT EXISTS (
    SELECT 1 FROM resources s
    WHERE s.topic_id = r.topic_id AND s.position <> 0
  );

-- DOWN
ALTER TABLE resources DROP COLUMN IF EXISTS position;
