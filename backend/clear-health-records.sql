-- Clear all health records and related files
-- Run this SQL script to delete all existing health records

-- First, delete all health record files (if the table exists)
DELETE FROM HealthRecordFiles;

-- Then, delete all health records
DELETE FROM HealthRecords;

-- Reset auto-increment if using SQL Server/MySQL (SQLite doesn't need this)
-- For SQLite, the IDs will continue from where they left off

-- Verify deletion
SELECT COUNT(*) as RemainingRecords FROM HealthRecords;
SELECT COUNT(*) as RemainingFiles FROM HealthRecordFiles;