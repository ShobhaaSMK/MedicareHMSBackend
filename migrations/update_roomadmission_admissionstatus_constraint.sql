-- Migration: Update AdmissionStatus CHECK constraint order in RoomAdmission table
-- Date: 2025-12-12
-- 
-- This migration updates the AdmissionStatus CHECK constraint to match the code order:
-- Active, Moved to ICU, Surgery Scheduled, Discharged

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the existing CHECK constraint on AdmissionStatus column by checking the constraint definition
    SELECT conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'RoomAdmission'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) LIKE '%AdmissionStatus%';
    
    -- Drop the existing constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "RoomAdmission" DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped existing AdmissionStatus constraint: %', constraint_name;
    END IF;
    
    -- Add the constraint with the updated order (only if it doesn't already exist)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RoomAdmission_AdmissionStatus_check'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        ADD CONSTRAINT "RoomAdmission_AdmissionStatus_check"
        CHECK ("AdmissionStatus" IN ('Active', 'Moved to ICU', 'Surgery Scheduled', 'Discharged'));
        RAISE NOTICE 'Added AdmissionStatus constraint with updated order';
    ELSE
        RAISE NOTICE 'AdmissionStatus constraint already exists with correct definition';
    END IF;
END $$;

