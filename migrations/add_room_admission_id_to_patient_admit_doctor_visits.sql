-- Migration: Add RoomAdmissionId column to PatientAdmitDoctorVisits table
-- Date: 2025-12-03

-- Add RoomAdmissionId column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PatientAdmitDoctorVisits' 
        AND column_name = 'RoomAdmissionId'
    ) THEN
        ALTER TABLE "PatientAdmitDoctorVisits"
        ADD COLUMN "RoomAdmissionId" INTEGER;

        -- Add foreign key constraint
        ALTER TABLE "PatientAdmitDoctorVisits"
        ADD CONSTRAINT "PatientAdmitDoctorVisits_RoomAdmissionId_fkey"
        FOREIGN KEY ("RoomAdmissionId") 
        REFERENCES "RoomAdmission"("RoomAdmissionId") 
        ON DELETE SET NULL;

        RAISE NOTICE 'Added RoomAdmissionId column to PatientAdmitDoctorVisits table';
    ELSE
        RAISE NOTICE 'RoomAdmissionId column already exists in PatientAdmitDoctorVisits table';
    END IF;
END $$;

