-- Migration: Add row_colors to settings table for priority row color themes
-- Run this if your database was created before this feature was added

ALTER TABLE settings ADD COLUMN IF NOT EXISTS row_colors JSONB DEFAULT '{"very_urgent":"red","urgent":"yellow","medium":"blue","low":"green"}'::jsonb;
