-- Migration: Add missing columns to ICUVisitVitals table
-- Date: 2025-12-11
-- 
-- This migration adds the following columns if they don't exist:
-- - DailyOrHourlyVitals (VARCHAR(50) with CHECK constraint)
-- - PatientCondition (VARCHAR(50) with CHECK constraint)
-- - BloodSugar (DECIMAL(5, 2))

DO $$
BEGIN
    -- Add DailyOrHourlyVitals column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'DailyOrHourlyVitals'
    ) THEN
        ALTER TABLE "ICUVisitVitals" 
        ADD COLUMN "DailyOrHourlyVitals" VARCHAR(50) CHECK ("DailyOrHourlyVitals" IN ('Daily', 'Hourly'));
        RAISE NOTICE 'Added DailyOrHourlyVitals column to ICUVisitVitals';
    ELSE
        RAISE NOTICE 'DailyOrHourlyVitals column already exists in ICUVisitVitals';
    END IF;

    -- Add PatientCondition column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'PatientCondition'
    ) THEN
        ALTER TABLE "ICUVisitVitals" 
        ADD COLUMN "PatientCondition" VARCHAR(50) CHECK ("PatientCondition" IN ('Stable', 'Notstable'));
        RAISE NOTICE 'Added PatientCondition column to ICUVisitVitals';
    ELSE
        RAISE NOTICE 'PatientCondition column already exists in ICUVisitVitals';
    END IF;

    -- Make NurseId nullable if it's currently NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'NurseId'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "ICUVisitVitals" 
        ALTER COLUMN "NurseId" DROP NOT NULL;
        RAISE NOTICE 'Changed NurseId to nullable in ICUVisitVitals';
    ELSE
        RAISE NOTICE 'NurseId is already nullable or does not exist';
    END IF;

    -- Add BloodSugar column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'BloodSugar'
    ) THEN
        ALTER TABLE "ICUVisitVitals" 
        ADD COLUMN "BloodSugar" DECIMAL(5, 2);
        RAISE NOTICE 'Added BloodSugar column to ICUVisitVitals';
    ELSE
        RAISE NOTICE 'BloodSugar column already exists in ICUVisitVitals';
    END IF;

    -- Create index for DailyOrHourlyVitals if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_dailyorhourlyvitals ON "ICUVisitVitals"("DailyOrHourlyVitals");
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

