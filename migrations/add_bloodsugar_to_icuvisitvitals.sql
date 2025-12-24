-- Migration: Add BloodSugar column to ICUVisitVitals table

DO $$
BEGIN
    -- Add BloodSugar column to ICUVisitVitals if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ICUVisitVitals'
        AND column_name = 'BloodSugar'
    ) THEN
        ALTER TABLE "ICUVisitVitals" ADD COLUMN "BloodSugar" DECIMAL(5, 2);
        RAISE NOTICE 'Added BloodSugar column to ICUVisitVitals table';
    ELSE
        RAISE NOTICE 'BloodSugar column already exists in ICUVisitVitals table';
    END IF;
END $$;