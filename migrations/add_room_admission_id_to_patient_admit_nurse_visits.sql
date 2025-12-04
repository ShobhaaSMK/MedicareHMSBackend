-- Migration: Add RoomAdmissionId column to PatientAdmitNurseVisits table
-- Date: 2025-12-03

-- Add RoomAdmissionId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PatientAdmitNurseVisits' 
        AND column_name = 'RoomAdmissionId'
    ) THEN
        ALTER TABLE "PatientAdmitNurseVisits"
        ADD COLUMN "RoomAdmissionId" INTEGER;

        -- Add foreign key constraint
        ALTER TABLE "PatientAdmitNurseVisits"
        ADD CONSTRAINT "PatientAdmitNurseVisits_RoomAdmissionId_fkey"
        FOREIGN KEY ("RoomAdmissionId") 
        REFERENCES "RoomAdmission"("RoomAdmissionId") 
        ON DELETE SET NULL;

        RAISE NOTICE 'Added RoomAdmissionId column to PatientAdmitNurseVisits table';
    ELSE
        RAISE NOTICE 'RoomAdmissionId column already exists in PatientAdmitNurseVisits table';
    END IF;
END $$;

