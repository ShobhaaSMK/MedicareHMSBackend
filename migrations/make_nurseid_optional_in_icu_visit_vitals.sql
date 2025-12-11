-- Migration: Make NurseId optional (nullable) in ICUVisitVitals table
-- Date: 2025-12-11
-- 
-- This migration changes NurseId from NOT NULL to nullable

DO $$
BEGIN
    -- Check if NurseId column exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'NurseId'
        AND is_nullable = 'NO'
    ) THEN
        -- Alter the column to allow NULL
        ALTER TABLE "ICUVisitVitals" 
        ALTER COLUMN "NurseId" DROP NOT NULL;
        RAISE NOTICE 'Changed NurseId to nullable in ICUVisitVitals table';
    ELSE
        RAISE NOTICE 'NurseId column is already nullable or does not exist';
    END IF;
END $$;

