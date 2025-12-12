-- Migration: Add CHECK constraint to VitalsStatus column in ICUVisitVitals
-- Date: 2025-12-11
-- 
-- This migration adds a CHECK constraint to the existing VitalsStatus column in ICUVisitVitals table
-- with values: 'Stable', 'Critical', 'Improving', 'Normal'
-- If the table doesn't exist, this migration will skip (table should be created via init_tables.sql first)

DO $$
BEGIN
    -- Check if table exists first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals'
    ) THEN
        RAISE NOTICE 'ICUVisitVitals table does not exist. Please create the table first using init_tables.sql';
        RETURN;
    END IF;

    -- Check if VitalsStatus column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'VitalsStatus'
    ) THEN
        -- Add VitalsStatus column if it doesn't exist
        ALTER TABLE "ICUVisitVitals" 
        ADD COLUMN "VitalsStatus" VARCHAR(50) CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving', 'Normal'));
        RAISE NOTICE 'Added VitalsStatus column to ICUVisitVitals with CHECK constraint';
    ELSE
        RAISE NOTICE 'VitalsStatus column already exists in ICUVisitVitals';
        
        -- Check if the column exists but doesn't have a CHECK constraint
        -- If it doesn't have a constraint, add one
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname LIKE '%ICUVisitVitals%VitalsStatus%'
            AND contype = 'c'
        ) THEN
            -- Add CHECK constraint if it doesn't exist
            ALTER TABLE "ICUVisitVitals" 
            ADD CONSTRAINT "ICUVisitVitals_VitalsStatus_check" 
            CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving', 'Normal'));
            RAISE NOTICE 'Added CHECK constraint to VitalsStatus column';
        ELSE
            RAISE NOTICE 'CHECK constraint already exists on VitalsStatus column';
        END IF;
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'ICUVisitVitals' 
        AND indexname = 'idx_icuvisitvitals_vitalsstatus'
    ) THEN
        CREATE INDEX idx_icuvisitvitals_vitalsstatus ON "ICUVisitVitals"("VitalsStatus");
        RAISE NOTICE 'Created index on VitalsStatus column';
    ELSE
        RAISE NOTICE 'Index on VitalsStatus column already exists';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

