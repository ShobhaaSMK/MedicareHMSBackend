-- Migration: Remove RequiresVentilator column from PatientICUAdmission table
-- Date: 2025-12-09
-- Description: Drops the RequiresVentilator column and its constraint

-- Drop the CHECK constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_requiresventilator_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        DROP CONSTRAINT "patienticuadmission_requiresventilator_check";
    END IF;
END
$$;

-- Drop the RequiresVentilator column if it exists
ALTER TABLE "PatientICUAdmission"
DROP COLUMN IF EXISTS "RequiresVentilator";
