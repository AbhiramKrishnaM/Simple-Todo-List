-- Migration: Add google_event_id to tasks table for Google Calendar sync
-- Run this so calendar-created tasks can be matched back to their event on future updates.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_google_event_id ON tasks(google_event_id) WHERE google_event_id IS NOT NULL;
