-- Migration: Drop PatientAdmitNurseVisits table
-- This table is no longer needed as the relationship was removed

DO $$
BEGIN
    -- Check if the table exists before dropping
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'PatientAdmitNurseVisits'
    ) THEN
        -- Drop the table
        DROP TABLE "PatientAdmitNurseVisits";
        RAISE NOTICE 'Successfully dropped PatientAdmitNurseVisits table';
    ELSE
        RAISE NOTICE 'PatientAdmitNurseVisits table does not exist, skipping drop';
    END IF;
END $$;