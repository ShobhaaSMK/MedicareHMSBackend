-- Migration: Add AttendingDoctorId column to PatientICUAdmission table
-- Date: 2025-01-XX
-- Description: Adds AttendingDoctorId field to track the attending doctor for ICU admissions

-- Add AttendingDoctorId column if it doesn't exist
ALTER TABLE "PatientICUAdmission"
ADD COLUMN IF NOT EXISTS "AttendingDoctorId" INTEGER;

-- Add FOREIGN KEY constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_attendingdoctorid_fkey'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        ADD CONSTRAINT "patienticuadmission_attendingdoctorid_fkey"
        FOREIGN KEY ("AttendingDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
    END IF;
END
$$;

