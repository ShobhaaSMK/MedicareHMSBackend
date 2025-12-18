-- Migration: Add PatientType column to RoomAdmission table
-- Date: 2025-01-XX
-- 
-- This migration adds the PatientType column to RoomAdmission table
-- Allowed values: 'OPD', 'Emergency', 'Direct'

DO $$
BEGIN
    -- Add PatientType column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission' 
        AND column_name = 'PatientType'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        ADD COLUMN "PatientType" VARCHAR(50) CHECK ("PatientType" IN ('OPD', 'Emergency', 'Direct'));
        RAISE NOTICE 'Added PatientType column to RoomAdmission';
    ELSE
        RAISE NOTICE 'PatientType column already exists in RoomAdmission';
    END IF;

    -- Add comment to the column
    COMMENT ON COLUMN "RoomAdmission"."PatientType" IS 'Type of patient admission: OPD (from appointment), Emergency (from emergency), or Direct (direct admission)';
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

