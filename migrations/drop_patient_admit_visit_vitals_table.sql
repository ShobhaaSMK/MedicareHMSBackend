-- Migration: Drop PatientAdmitVisitVitals table
-- Date: 2025-12-11
-- 
-- This migration drops the PatientAdmitVisitVitals table and all its indexes

DO $$
BEGIN
    -- Drop indexes first
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_patientid;
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_nurseid;
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_patientstatus;
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_recordeddatetime;
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_vitalsstatus;
    DROP INDEX IF EXISTS idx_patientadmitvisitvitals_status;
    
    RAISE NOTICE 'Dropped all indexes for PatientAdmitVisitVitals table';
    
    -- Drop the table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals'
    ) THEN
        DROP TABLE "PatientAdmitVisitVitals" CASCADE;
        RAISE NOTICE 'Dropped PatientAdmitVisitVitals table';
    ELSE
        RAISE NOTICE 'PatientAdmitVisitVitals table does not exist';
    END IF;
END $$;

