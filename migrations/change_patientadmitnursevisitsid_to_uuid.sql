-- Migration: Change PatientAdmitNurseVisitsId column in PatientAdmitVisitVitals from integer to uuid
-- This aligns with the PatientAdmitNurseVisits table primary key type

-- First, check if the column exists and is integer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'PatientAdmitVisitVitals'
        AND column_name = 'PatientAdmitNurseVisitsId'
        AND data_type = 'integer'
    ) THEN
        -- Alter the column type from integer to uuid
        ALTER TABLE "PatientAdmitVisitVitals"
        ALTER COLUMN "PatientAdmitNurseVisitsId" TYPE uuid USING "PatientAdmitNurseVisitsId"::text::uuid;

        RAISE NOTICE 'Successfully changed PatientAdmitNurseVisitsId column to uuid type';
    ELSE
        RAISE NOTICE 'PatientAdmitNurseVisitsId column is not integer type or does not exist';
    END IF;
END $$;