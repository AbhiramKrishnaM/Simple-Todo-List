-- Remove priority column and index from tasks table
-- Run this after deploying the backend that no longer uses priority.

DROP INDEX IF EXISTS idx_tasks_priority;

ALTER TABLE tasks
DROP COLUMN IF EXISTS priority;
