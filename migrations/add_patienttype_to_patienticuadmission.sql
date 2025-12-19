-- Migration: Add PatientType column to PatientICUAdmission table
-- Date: 2025-01-XX
-- 
-- This migration adds the PatientType column to PatientICUAdmission table
-- Allowed values: 'OPD', 'IPD', 'Emergency', 'Direct'

DO $$
BEGIN
    -- Add PatientType column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientICUAdmission' 
        AND column_name = 'PatientType'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        ADD COLUMN "PatientType" VARCHAR(50) CHECK ("PatientType" IN ('OPD', 'IPD', 'Emergency', 'Direct'));
        RAISE NOTICE 'Added PatientType column to PatientICUAdmission';
    ELSE
        RAISE NOTICE 'PatientType column already exists in PatientICUAdmission';
    END IF;

    -- Add comment to the column
    COMMENT ON COLUMN "PatientICUAdmission"."PatientType" IS 'Type of patient admission: OPD (from appointment), IPD (from room admission), Emergency (from emergency), or Direct (direct admission)';
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

