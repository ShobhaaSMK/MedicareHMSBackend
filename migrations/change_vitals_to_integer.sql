-- Migration: Change Temperature and O2Saturation from DECIMAL to INTEGER in ICUVisitVitals
-- This migration updates the data type for Temperature and O2Saturation columns

DO $$
BEGIN
    -- Check if Temperature column exists and is not already INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ICUVisitVitals' 
        AND column_name = 'Temperature'
        AND data_type != 'integer'
    ) THEN
        -- Convert existing DECIMAL values to INTEGER (rounding)
        ALTER TABLE "ICUVisitVitals" 
        ALTER COLUMN "Temperature" TYPE INTEGER USING ROUND("Temperature")::INTEGER;
        
        RAISE NOTICE 'Temperature column changed to INTEGER';
    ELSE
        RAISE NOTICE 'Temperature column is already INTEGER or does not exist';
    END IF;

    -- Check if O2Saturation column exists and is not already INTEGER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ICUVisitVitals' 
        AND column_name = 'O2Saturation'
        AND data_type != 'integer'
    ) THEN
        -- Convert existing DECIMAL values to INTEGER (rounding)
        ALTER TABLE "ICUVisitVitals" 
        ALTER COLUMN "O2Saturation" TYPE INTEGER USING ROUND("O2Saturation")::INTEGER;
        
        RAISE NOTICE 'O2Saturation column changed to INTEGER';
    ELSE
        RAISE NOTICE 'O2Saturation column is already INTEGER or does not exist';
    END IF;
END $$;

