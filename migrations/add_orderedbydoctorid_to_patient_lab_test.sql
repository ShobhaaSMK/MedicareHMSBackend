-- Migration: Add OrderedByDoctorId column to PatientLabTest table
-- Date: 2025-12-11
-- 
-- This migration adds the OrderedByDoctorId column to PatientLabTest table

DO $$
BEGIN
    -- Add OrderedByDoctorId column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'OrderedByDoctorId'
    ) THEN
        ALTER TABLE "PatientLabTest" 
        ADD COLUMN "OrderedByDoctorId" INTEGER;
        RAISE NOTICE 'Added OrderedByDoctorId column to PatientLabTest';
    ELSE
        RAISE NOTICE 'OrderedByDoctorId column already exists in PatientLabTest';
    END IF;

    -- Add foreign key constraint for OrderedByDoctorId if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientLabTest_OrderedByDoctorId_fkey'
    ) THEN
        ALTER TABLE "PatientLabTest" 
        ADD CONSTRAINT "PatientLabTest_OrderedByDoctorId_fkey" 
        FOREIGN KEY ("OrderedByDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint for OrderedByDoctorId';
    ELSE
        RAISE NOTICE 'Foreign key constraint for OrderedByDoctorId already exists';
    END IF;

    -- Create index if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_patientlabtest_orderedbydoctorid ON "PatientLabTest"("OrderedByDoctorId");
    
    RAISE NOTICE 'Migration completed successfully';
END $$;

