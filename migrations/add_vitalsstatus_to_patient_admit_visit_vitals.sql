-- Migration: Add VitalsStatus column to PatientAdmitVisitVitals
-- Date: 2025-12-11
-- 
-- This migration adds the VitalsStatus column to PatientAdmitVisitVitals table
-- with CHECK constraint for values: 'Stable', 'Critical', 'Improving', 'Normal'
-- If the table doesn't exist, this migration will skip (table should be created via init_tables.sql first)

DO $$
BEGIN
    -- Check if table exists first
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals'
    ) THEN
        RAISE NOTICE 'PatientAdmitVisitVitals table does not exist. Please create the table first using init_tables.sql';
        RETURN;
    END IF;

    -- Add VitalsStatus column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'VitalsStatus'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD COLUMN "VitalsStatus" VARCHAR(50) CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving', 'Normal'));
        RAISE NOTICE 'Added VitalsStatus column to PatientAdmitVisitVitals';
    ELSE
        RAISE NOTICE 'VitalsStatus column already exists in PatientAdmitVisitVitals';
        
        -- Check if the column exists but doesn't have a CHECK constraint
        -- If it doesn't have a constraint, add one
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname LIKE '%PatientAdmitVisitVitals%VitalsStatus%'
            AND contype = 'c'
        ) THEN
            -- Add CHECK constraint if it doesn't exist
            ALTER TABLE "PatientAdmitVisitVitals" 
            ADD CONSTRAINT "PatientAdmitVisitVitals_VitalsStatus_check" 
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
        AND tablename = 'PatientAdmitVisitVitals' 
        AND indexname = 'idx_patientadmitvisitvitals_vitalsstatus'
    ) THEN
        CREATE INDEX idx_patientadmitvisitvitals_vitalsstatus ON "PatientAdmitVisitVitals"("VitalsStatus");
        RAISE NOTICE 'Created index on VitalsStatus column';
    ELSE
        RAISE NOTICE 'Index on VitalsStatus column already exists';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

