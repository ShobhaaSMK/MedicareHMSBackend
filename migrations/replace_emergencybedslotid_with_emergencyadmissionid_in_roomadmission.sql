-- Migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in RoomAdmission table
-- Date: 2025-01-XX
-- 
-- This migration:
-- 1. Removes the EmergencyBedSlotId column from RoomAdmission table
-- 2. Adds EmergencyAdmissionId column (INTEGER, references EmergencyAdmission table)
-- 3. Updates foreign key constraints

DO $$
BEGIN
    -- Step 1: Drop the foreign key constraint on EmergencyBedSlotId if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RoomAdmission_EmergencyBedSlotId_fkey'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        DROP CONSTRAINT "RoomAdmission_EmergencyBedSlotId_fkey";
        RAISE NOTICE 'Dropped foreign key constraint on EmergencyBedSlotId';
    ELSE
        RAISE NOTICE 'Foreign key constraint on EmergencyBedSlotId does not exist';
    END IF;

    -- Step 2: Drop the EmergencyBedSlotId column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission' 
        AND column_name = 'EmergencyBedSlotId'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        DROP COLUMN "EmergencyBedSlotId";
        RAISE NOTICE 'Dropped EmergencyBedSlotId column';
    ELSE
        RAISE NOTICE 'EmergencyBedSlotId column does not exist';
    END IF;

    -- Step 3: Add EmergencyAdmissionId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission' 
        AND column_name = 'EmergencyAdmissionId'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        ADD COLUMN "EmergencyAdmissionId" INTEGER;
        RAISE NOTICE 'Added EmergencyAdmissionId column';
    ELSE
        RAISE NOTICE 'EmergencyAdmissionId column already exists';
    END IF;

    -- Step 4: Add foreign key constraint for EmergencyAdmissionId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RoomAdmission_EmergencyAdmissionId_fkey'
    ) THEN
        ALTER TABLE "RoomAdmission" 
        ADD CONSTRAINT "RoomAdmission_EmergencyAdmissionId_fkey" 
        FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for EmergencyAdmissionId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for EmergencyAdmissionId already exists';
    END IF;

END $$;

