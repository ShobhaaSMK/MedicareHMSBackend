-- Migration: Add ChargesPerDay column to EmergencyBed table
-- This migration adds the ChargesPerDay column if it doesn't already exist

DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'EmergencyBed' 
        AND column_name = 'ChargesPerDay'
    ) THEN
        -- Add the ChargesPerDay column
        ALTER TABLE "EmergencyBed" 
        ADD COLUMN "ChargesPerDay" DECIMAL(10, 2);
        
        RAISE NOTICE 'Added ChargesPerDay column to EmergencyBed table';
    ELSE
        RAISE NOTICE 'ChargesPerDay column already exists in EmergencyBed table';
    END IF;
END $$;

