-- Migration: Drop PatientAdmitNurseVisitsId column from PatientAdmitVisitVitals table
-- This removes the foreign key relationship to PatientAdmitNurseVisits

-- First, check if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'PatientAdmitVisitVitals'
        AND column_name = 'PatientAdmitNurseVisitsId'
    ) THEN
        -- Drop the column
        ALTER TABLE "PatientAdmitVisitVitals"
        DROP COLUMN "PatientAdmitNurseVisitsId";

        RAISE NOTICE 'Successfully dropped PatientAdmitNurseVisitsId column from PatientAdmitVisitVitals';
    ELSE
        RAISE NOTICE 'PatientAdmitNurseVisitsId column does not exist in PatientAdmitVisitVitals';
    END IF;
END $$;