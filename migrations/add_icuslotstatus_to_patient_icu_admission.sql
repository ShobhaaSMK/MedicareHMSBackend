-- Migration: Add ICUSlotStatus column to PatientICUAdmission table
-- Date: 2025-12-03
-- Description: Adds ICUSlotStatus field with values 'Occupied' or 'Discharged'

-- Add ICUSlotStatus column if it doesn't exist
ALTER TABLE "PatientICUAdmission"
ADD COLUMN IF NOT EXISTS "ICUSlotStatus" VARCHAR(50) DEFAULT 'Occupied';

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_icuslotstatus_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        ADD CONSTRAINT "patienticuadmission_icuslotstatus_check"
        CHECK ("ICUSlotStatus" IN ('Occupied', 'Discharged'));
    END IF;
END
$$;

-- Update existing records to have default value if NULL
UPDATE "PatientICUAdmission"
SET "ICUSlotStatus" = 'Occupied'
WHERE "ICUSlotStatus" IS NULL;

