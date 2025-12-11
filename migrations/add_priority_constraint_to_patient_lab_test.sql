-- Migration: Add CHECK constraint for Priority field in PatientLabTest table
-- Date: 2025-12-11
-- 
-- This migration adds a CHECK constraint to ensure Priority can only be 'Normal' or 'Urgent'

DO $$
BEGIN
    -- Drop existing constraint if it exists (in case we need to recreate it)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientLabTest_Priority_check'
    ) THEN
        ALTER TABLE "PatientLabTest" 
        DROP CONSTRAINT "PatientLabTest_Priority_check";
        RAISE NOTICE 'Dropped existing Priority constraint';
    END IF;

    -- Add CHECK constraint for Priority
    ALTER TABLE "PatientLabTest" 
    ADD CONSTRAINT "PatientLabTest_Priority_check" 
    CHECK ("Priority" IS NULL OR "Priority" IN ('Normal', 'Urgent'));
    
    RAISE NOTICE 'Added CHECK constraint for Priority field';
    RAISE NOTICE 'Migration completed successfully';
END $$;

