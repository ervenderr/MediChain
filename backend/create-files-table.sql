-- Create HealthRecordFiles table for SQLite
CREATE TABLE IF NOT EXISTS "HealthRecordFiles" (
    "FileID" TEXT NOT NULL CONSTRAINT "PK_HealthRecordFiles" PRIMARY KEY,
    "RecordID" TEXT NOT NULL,
    "OriginalFileName" TEXT NOT NULL,
    "StoredFileName" TEXT NOT NULL,
    "ContentType" TEXT NOT NULL,
    "FileSize" INTEGER NOT NULL,
    "FilePath" TEXT NOT NULL,
    "UploadedAt" TEXT NOT NULL,
    CONSTRAINT "FK_HealthRecordFiles_HealthRecords_RecordID" FOREIGN KEY ("RecordID") REFERENCES "HealthRecords" ("RecordID") ON DELETE CASCADE
);

-- Create index on RecordID for better performance
CREATE INDEX IF NOT EXISTS "IX_HealthRecordFiles_RecordID" ON "HealthRecordFiles" ("RecordID");

-- Verify table was created
SELECT name FROM sqlite_master WHERE type='table' AND name='HealthRecordFiles';