-- Migration: Add NurseId, PatientStatus, and VisitRemarks to PatientAdmitVisitVitals
-- Date: 2025-12-11
-- 
-- This migration adds the following columns to PatientAdmitVisitVitals table:
-- - NurseId (INTEGER, Foreign Key to Users)
-- - PatientStatus (VARCHAR(50) with CHECK constraint for 'Stable'/'Notstable')
-- - VisitRemarks (TEXT)

DO $$
BEGIN
    -- Add NurseId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'NurseId'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD COLUMN "NurseId" INTEGER;
        RAISE NOTICE 'Added NurseId column to PatientAdmitVisitVitals';
    ELSE
        RAISE NOTICE 'NurseId column already exists in PatientAdmitVisitVitals';
    END IF;

    -- Add foreign key constraint for NurseId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientAdmitVisitVitals_NurseId_fkey'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD CONSTRAINT "PatientAdmitVisitVitals_NurseId_fkey" 
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for NurseId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for NurseId already exists';
    END IF;

    -- Add PatientStatus column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'PatientStatus'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD COLUMN "PatientStatus" VARCHAR(50) CHECK ("PatientStatus" IN ('Stable', 'Notstable'));
        RAISE NOTICE 'Added PatientStatus column to PatientAdmitVisitVitals';
    ELSE
        RAISE NOTICE 'PatientStatus column already exists in PatientAdmitVisitVitals';
    END IF;

    -- Add VisitRemarks column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'VisitRemarks'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD COLUMN "VisitRemarks" TEXT;
        RAISE NOTICE 'Added VisitRemarks column to PatientAdmitVisitVitals';
    ELSE
        RAISE NOTICE 'VisitRemarks column already exists in PatientAdmitVisitVitals';
    END IF;

    -- Create indexes if they don't exist
    CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_nurseid ON "PatientAdmitVisitVitals"("NurseId");
    CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_patientstatus ON "PatientAdmitVisitVitals"("PatientStatus");
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

