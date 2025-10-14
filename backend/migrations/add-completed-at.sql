-- Migration: Add completed_at column to tasks table
-- This migration adds a completed_at timestamp to track when tasks were completed
-- Run this if your database was created before this feature was added

-- Add completed_at column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Update existing completed tasks to have completed_at = updated_at
UPDATE tasks 
SET completed_at = updated_at 
WHERE completed = true AND completed_at IS NULL;

-- Create index for efficient querying of old completed tasks
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND column_name = 'completed_at';

