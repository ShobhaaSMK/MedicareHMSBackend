-- Migration: Add RequiresVentilator column to PatientICUAdmission table
-- Date: 2025-12-09
-- Description: Adds RequiresVentilator field with values 'Yes' or 'No'

-- Add RequiresVentilator column if it doesn't exist
ALTER TABLE "PatientICUAdmission"
ADD COLUMN IF NOT EXISTS "RequiresVentilator" VARCHAR(10) DEFAULT 'No';

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_requiresventilator_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        ADD CONSTRAINT "patienticuadmission_requiresventilator_check"
        CHECK ("RequiresVentilator" IN ('Yes', 'No'));
    END IF;
END
$$;

-- Update existing records to have default value if NULL
UPDATE "PatientICUAdmission"
SET "RequiresVentilator" = 'No'
WHERE "RequiresVentilator" IS NULL;
