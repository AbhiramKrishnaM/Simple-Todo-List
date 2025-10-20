-- Add order column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Set initial order based on existing timestamp (older tasks = higher order)
UPDATE tasks 
SET display_order = row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp ASC) as row_number 
  FROM tasks
) AS numbered
WHERE tasks.id = numbered.id;

-- Make the column NOT NULL after populating
ALTER TABLE tasks 
ALTER COLUMN display_order SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(display_order);

