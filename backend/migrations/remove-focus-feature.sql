-- Migration: Remove focus/timer feature
-- Run this if you had the focus timer feature and want to clean up the schema

-- Drop focus_sessions table
DROP TABLE IF EXISTS focus_sessions;

-- Remove focus_duration column from tasks (PostgreSQL 9+)
ALTER TABLE tasks DROP COLUMN IF EXISTS focus_duration;
