-- Create database (run this as postgres superuser)
-- CREATE DATABASE todolist;

-- Connect to the database and create tables
-- \c todolist

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_timestamp ON tasks(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- Optional: Insert sample data
-- INSERT INTO tasks (id, title, timestamp, completed, meta) VALUES
--   ('sample-1', 'Complete project documentation', 1696800000000, false, '{}'),
--   ('sample-2', 'Review pull requests', 1696800100000, false, '{}'),
--   ('sample-3', 'Team meeting preparation', 1696800200000, true, '{}');

COMMENT ON TABLE tasks IS 'Task management table for TodoList application';
COMMENT ON COLUMN tasks.id IS 'Unique identifier for the task';
COMMENT ON COLUMN tasks.title IS 'Task description/title';
COMMENT ON COLUMN tasks.timestamp IS 'Unix timestamp in milliseconds when task was created';
COMMENT ON COLUMN tasks.completed IS 'Whether the task is completed';
COMMENT ON COLUMN tasks.meta IS 'Additional metadata stored as JSON';
COMMENT ON COLUMN tasks.created_at IS 'Database record creation timestamp';
COMMENT ON COLUMN tasks.updated_at IS 'Database record last update timestamp';

