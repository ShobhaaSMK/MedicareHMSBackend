-- Migration: Change CreatedBy from UUID to INTEGER in PatientLabTest table
-- Date: 2025-12-12
-- 
-- This migration changes the CreatedBy column from UUID to INTEGER
-- Note: Existing UUID values will be set to NULL as they cannot be converted to integers

DO $$
BEGIN
    -- Check if CreatedBy is already INTEGER
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'CreatedBy'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'CreatedBy is already INTEGER in PatientLabTest table';
    ELSE
        RAISE NOTICE 'Starting migration: Changing CreatedBy from UUID to INTEGER...';
        
        -- Step 1: Drop foreign key constraint if it exists (unlikely, but check anyway)
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'PatientLabTest_CreatedBy_fkey'
        ) THEN
            ALTER TABLE "PatientLabTest" 
            DROP CONSTRAINT "PatientLabTest_CreatedBy_fkey";
            RAISE NOTICE 'Dropped PatientLabTest_CreatedBy_fkey constraint';
        END IF;
        
        -- Step 2: Set all existing UUID values to NULL (cannot convert UUID to integer)
        UPDATE "PatientLabTest" 
        SET "CreatedBy" = NULL 
        WHERE "CreatedBy" IS NOT NULL;
        RAISE NOTICE 'Set all existing CreatedBy UUID values to NULL';
        
        -- Step 3: Change column type from UUID to INTEGER
        ALTER TABLE "PatientLabTest" 
        ALTER COLUMN "CreatedBy" TYPE INTEGER USING NULL;
        RAISE NOTICE 'Changed CreatedBy column type to INTEGER';
        
        -- Step 4: Add foreign key constraint to Users table
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'PatientLabTest_CreatedBy_fkey'
        ) THEN
            ALTER TABLE "PatientLabTest" 
            ADD CONSTRAINT "PatientLabTest_CreatedBy_fkey"
            FOREIGN KEY ("CreatedBy") 
            REFERENCES "Users"("UserId") 
            ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for CreatedBy';
        END IF;
        
        -- Step 5: Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_patientlabtest_createdby 
        ON "PatientLabTest"("CreatedBy");
        RAISE NOTICE 'Created index on CreatedBy column';
        
        RAISE NOTICE 'Migration completed: CreatedBy is now INTEGER';
    END IF;
END $$;

