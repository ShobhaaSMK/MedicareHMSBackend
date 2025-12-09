-- Migration: Add OnVentilator column to PatientICUAdmission table
-- Date: 2025-12-09
-- Description: Adds OnVentilator field with values 'Yes' or 'No'

-- Add OnVentilator column if it doesn't exist
ALTER TABLE "PatientICUAdmission"
ADD COLUMN IF NOT EXISTS "OnVentilator" VARCHAR(10) DEFAULT 'No';

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_onventilator_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        ADD CONSTRAINT "patienticuadmission_onventilator_check"
        CHECK ("OnVentilator" IN ('Yes', 'No'));
    END IF;
END
$$;

-- Update existing records to have default value if NULL
UPDATE "PatientICUAdmission"
SET "OnVentilator" = 'No'
WHERE "OnVentilator" IS NULL;
