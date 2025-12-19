-- Migration: Replace EmergencyBedSlotId with EmergencyBedId in EmergencyAdmission table
-- Date: 2025-01-XX
-- 
-- This migration:
-- 1. Removes the EmergencyBedSlotId column from EmergencyAdmission table
-- 2. Adds EmergencyBedId column (INTEGER, references EmergencyBed table)
-- 3. Updates foreign key constraints

DO $$
BEGIN
    -- Step 1: Add EmergencyBedId column if it doesn't exist (BEFORE dropping the old column)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'EmergencyAdmission' 
        AND column_name = 'EmergencyBedId'
    ) THEN
        -- Add column as nullable first
        ALTER TABLE "EmergencyAdmission" 
        ADD COLUMN "EmergencyBedId" INTEGER;
        RAISE NOTICE 'Added EmergencyBedId column (nullable)';
        
        -- Step 2: Update existing rows: get EmergencyBedId from EmergencyBedSlot
        -- This works because EmergencyBedSlotId still exists at this point
        UPDATE "EmergencyAdmission" ea
        SET "EmergencyBedId" = (
            SELECT ebs."EmergencyBedId" 
            FROM "EmergencyBedSlot" ebs 
            WHERE ebs."EmergencyBedSlotId" = ea."EmergencyBedSlotId"
            LIMIT 1
        )
        WHERE EXISTS (
            SELECT 1 FROM "EmergencyBedSlot" ebs 
            WHERE ebs."EmergencyBedSlotId" = ea."EmergencyBedSlotId"
        );
        
        RAISE NOTICE 'Updated EmergencyBedId from EmergencyBedSlot references';
        
        -- For any remaining NULL values, you may want to handle them
        -- For now, we'll leave them as NULL (you can update this logic as needed)
        
    ELSE
        RAISE NOTICE 'EmergencyBedId column already exists';
    END IF;

    -- Step 3: Drop the foreign key constraint on EmergencyBedSlotId if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmergencyAdmission_EmergencyBedSlotId_fkey'
    ) THEN
        ALTER TABLE "EmergencyAdmission" 
        DROP CONSTRAINT "EmergencyAdmission_EmergencyBedSlotId_fkey";
        RAISE NOTICE 'Dropped foreign key constraint on EmergencyBedSlotId';
    ELSE
        RAISE NOTICE 'Foreign key constraint on EmergencyBedSlotId does not exist';
    END IF;

    -- Step 4: Drop the EmergencyBedSlotId column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'EmergencyAdmission' 
        AND column_name = 'EmergencyBedSlotId'
    ) THEN
        ALTER TABLE "EmergencyAdmission" 
        DROP COLUMN "EmergencyBedSlotId";
        RAISE NOTICE 'Dropped EmergencyBedSlotId column';
    ELSE
        RAISE NOTICE 'EmergencyBedSlotId column does not exist';
    END IF;

    -- Step 4: Add foreign key constraint for EmergencyBedId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmergencyAdmission_EmergencyBedId_fkey'
    ) THEN
        ALTER TABLE "EmergencyAdmission" 
        ADD CONSTRAINT "EmergencyAdmission_EmergencyBedId_fkey"
        FOREIGN KEY ("EmergencyBedId") REFERENCES "EmergencyBed"("EmergencyBedId") ON DELETE RESTRICT;
        RAISE NOTICE 'Added foreign key constraint for EmergencyBedId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for EmergencyBedId already exists';
    END IF;

    -- Step 5: Remove the DEFAULT constraint after adding the foreign key (if we want to make it required)
    -- Note: We set DEFAULT 1 above to avoid NOT NULL constraint issues, but you may want to update existing rows first
    -- ALTER TABLE "EmergencyAdmission" ALTER COLUMN "EmergencyBedId" DROP DEFAULT;

END $$;

