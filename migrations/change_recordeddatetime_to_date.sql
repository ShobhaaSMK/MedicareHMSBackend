-- Migration: Change RecordedDateTime column in PatientAdmitVisitVitals from timestamp to date
-- This will truncate the time part and keep only the date

-- First, check if the column exists and is timestamp
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'PatientAdmitVisitVitals'
        AND column_name = 'RecordedDateTime'
        AND data_type = 'timestamp without time zone'
    ) THEN
        -- Alter the column type from timestamp to date
        ALTER TABLE "PatientAdmitVisitVitals"
        ALTER COLUMN "RecordedDateTime" TYPE date;

        RAISE NOTICE 'Successfully changed RecordedDateTime column to date type';
    ELSE
        RAISE NOTICE 'RecordedDateTime column is not timestamp type or does not exist';
    END IF;
END $$;