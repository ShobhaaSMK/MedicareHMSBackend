-- Migration: Add EmergencyBedId column to PatientICUAdmission table
-- Date: 2025-01-XX
-- 
-- This migration adds the EmergencyBedId column to PatientICUAdmission table
-- This allows direct reference to EmergencyBed without going through EmergencyBedSlot

DO $$
BEGIN
    -- Add EmergencyBedId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientICUAdmission' 
        AND column_name = 'EmergencyBedId'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        ADD COLUMN "EmergencyBedId" INTEGER;
        RAISE NOTICE 'Added EmergencyBedId column to PatientICUAdmission';
    ELSE
        RAISE NOTICE 'EmergencyBedId column already exists in PatientICUAdmission';
    END IF;

    -- Add foreign key constraint for EmergencyBedId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientICUAdmission_EmergencyBedId_fkey'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        ADD CONSTRAINT "PatientICUAdmission_EmergencyBedId_fkey"
        FOREIGN KEY ("EmergencyBedId") REFERENCES "EmergencyBed"("EmergencyBedId") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for EmergencyBedId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for EmergencyBedId already exists';
    END IF;

    -- Add comment to the column
    COMMENT ON COLUMN "PatientICUAdmission"."EmergencyBedId" IS 'Direct reference to EmergencyBed (replaces EmergencyBedSlotId)';
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

