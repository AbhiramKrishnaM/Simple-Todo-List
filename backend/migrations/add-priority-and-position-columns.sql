-- Add priority and position as proper columns on tasks (canonical source; meta still used for compatibility)
-- Run this so the API and DB schema match the list shape (priority, position per task).

-- Add columns (nullable at first so existing rows are valid)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER;

-- Backfill from meta for existing rows
UPDATE tasks
SET
  priority = COALESCE(meta->>'priority', 'medium'),
  position = CASE
    WHEN meta->>'position' ~ '^\d+$' THEN (meta->>'position')::integer
    ELSE NULL
  END;

-- Set defaults for new rows (optional; app can always set explicitly)
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT 'medium';

-- Index for filtering/sorting by priority
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

COMMENT ON COLUMN tasks.priority IS 'Priority: very_urgent, urgent, medium, low';
COMMENT ON COLUMN tasks.position IS 'Position 1-5 within the priority row';
