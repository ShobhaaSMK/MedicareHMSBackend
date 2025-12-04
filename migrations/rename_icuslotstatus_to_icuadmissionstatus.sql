-- Migration: Rename ICUSlotStatus to ICUAdmissionStatus in PatientICUAdmission table
-- Date: 2025-12-03
-- Description: Renames ICUSlotStatus column to ICUAdmissionStatus

-- Rename the column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'PatientICUAdmission'
        AND column_name = 'ICUSlotStatus'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        RENAME COLUMN "ICUSlotStatus" TO "ICUAdmissionStatus";
        
        RAISE NOTICE 'Column ICUSlotStatus renamed to ICUAdmissionStatus';
    ELSE
        RAISE NOTICE 'Column ICUSlotStatus does not exist, skipping rename';
    END IF;
END
$$;

-- Drop old constraint if it exists and create new one
DO $$
BEGIN
    -- Drop old constraint
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_icuslotstatus_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        DROP CONSTRAINT "patienticuadmission_icuslotstatus_check";
    END IF;
    
    -- Add new constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'patienticuadmission_icuadmissionstatus_check'
    ) THEN
        ALTER TABLE "PatientICUAdmission"
        ADD CONSTRAINT "patienticuadmission_icuadmissionstatus_check"
        CHECK ("ICUAdmissionStatus" IN ('Occupied', 'Discharged'));
    END IF;
END
$$;

