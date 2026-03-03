-- Production Migration: Add showSalary field to Job table
-- This migration adds the showSalary boolean field with a default value of TRUE
-- Run this on your production SQLite database via SSH

-- Add showSalary column with default value of 1 (TRUE in SQLite)
ALTER TABLE Job ADD COLUMN showSalary BOOLEAN NOT NULL DEFAULT 1;

-- Optional: Verify the column was added
-- Run this in SQLite CLI after migration:
-- SELECT sql FROM sqlite_master WHERE type='table' AND name='Job';
