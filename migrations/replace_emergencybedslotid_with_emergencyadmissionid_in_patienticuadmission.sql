-- Migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in PatientICUAdmission table
-- Date: 2025-01-XX
-- 
-- This migration:
-- 1. Removes the EmergencyBedSlotId column from PatientICUAdmission table
-- 2. Adds EmergencyAdmissionId column (INTEGER, references EmergencyAdmission table)
-- 3. Updates foreign key constraints

DO $$
BEGIN
    -- Step 1: Add EmergencyAdmissionId column if it doesn't exist (BEFORE dropping the old column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientICUAdmission' 
        AND column_name = 'EmergencyAdmissionId'
    ) THEN
        -- Add column as nullable first
        ALTER TABLE "PatientICUAdmission" 
        ADD COLUMN "EmergencyAdmissionId" INTEGER;
        RAISE NOTICE 'Added EmergencyAdmissionId column (nullable)';
        
        -- Step 2: Update existing rows if needed
        -- Note: Since EmergencyBedSlotId and EmergencyAdmissionId are different concepts,
        -- we cannot automatically migrate data. Existing rows will have NULL for EmergencyAdmissionId.
        -- You may need to manually update these based on your business logic.
        
    ELSE
        RAISE NOTICE 'EmergencyAdmissionId column already exists';
    END IF;

    -- Step 3: Drop the foreign key constraint on EmergencyBedSlotId if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientICUAdmission_EmergencyBedSlotId_fkey'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        DROP CONSTRAINT "PatientICUAdmission_EmergencyBedSlotId_fkey";
        RAISE NOTICE 'Dropped foreign key constraint on EmergencyBedSlotId';
    ELSE
        RAISE NOTICE 'Foreign key constraint on EmergencyBedSlotId does not exist';
    END IF;

    -- Step 4: Drop the EmergencyBedSlotId column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientICUAdmission' 
        AND column_name = 'EmergencyBedSlotId'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        DROP COLUMN "EmergencyBedSlotId";
        RAISE NOTICE 'Dropped EmergencyBedSlotId column';
    ELSE
        RAISE NOTICE 'EmergencyBedSlotId column does not exist';
    END IF;

    -- Step 5: Add foreign key constraint for EmergencyAdmissionId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientICUAdmission_EmergencyAdmissionId_fkey'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        ADD CONSTRAINT "PatientICUAdmission_EmergencyAdmissionId_fkey"
        FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for EmergencyAdmissionId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for EmergencyAdmissionId already exists';
    END IF;

END $$;

