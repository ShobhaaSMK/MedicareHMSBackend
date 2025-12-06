-- Migration: Add CHECK constraint for IsVentilatorAttached in ICU table
-- Date: 2025-01-XX
-- 
-- This migration adds a CHECK constraint to ensure IsVentilatorAttached
-- can only be 'Yes' or 'No'

DO $$
BEGIN
    -- Check if the constraint already exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ICU_IsVentilatorAttached_check'
    ) THEN
        RAISE NOTICE 'CHECK constraint for IsVentilatorAttached already exists';
    ELSE
        -- Check if there are any invalid values in the table
        IF EXISTS (
            SELECT 1 FROM "ICU" 
            WHERE "IsVentilatorAttached" NOT IN ('Yes', 'No')
        ) THEN
            RAISE EXCEPTION 'Found invalid IsVentilatorAttached values. Please update all records to use "Yes" or "No" before running this migration.';
        END IF;
        
        -- Add the CHECK constraint
        ALTER TABLE "ICU"
        ADD CONSTRAINT "ICU_IsVentilatorAttached_check"
        CHECK ("IsVentilatorAttached" IN ('Yes', 'No'));
        
        RAISE NOTICE 'Added CHECK constraint for IsVentilatorAttached';
    END IF;
END $$;

