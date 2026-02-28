-- Migration: Add show_remaining_todo_count to settings table
-- Run this if your database was created before this feature was added

ALTER TABLE settings ADD COLUMN IF NOT EXISTS show_remaining_todo_count BOOLEAN NOT NULL DEFAULT true;
