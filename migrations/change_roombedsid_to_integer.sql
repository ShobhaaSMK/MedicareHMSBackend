-- Migration: Change RoomBedsId from UUID to INTEGER
-- Date: 2025-01-XX
-- 
-- WARNING: This migration requires the RoomBeds and RoomAdmission tables to be empty.
-- If you have existing data, clear it first using:
-- TRUNCATE TABLE "RoomAdmission" CASCADE;
-- TRUNCATE TABLE "RoomBeds" CASCADE;

DO $$
DECLARE
    room_beds_count INTEGER;
    room_admission_count INTEGER;
BEGIN
    -- Check if RoomBedsId is already INTEGER
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'RoomBeds' 
        AND column_name = 'RoomBedsId'
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'RoomBedsId is already INTEGER in RoomBeds table';
    ELSE
        RAISE NOTICE 'Starting migration: Changing RoomBedsId from UUID to INTEGER...';
        
        -- Check if tables have data
        SELECT COUNT(*) INTO room_beds_count FROM "RoomBeds";
        SELECT COUNT(*) INTO room_admission_count FROM "RoomAdmission";
        
        IF room_beds_count > 0 OR room_admission_count > 0 THEN
            RAISE EXCEPTION 'Tables contain data. Please clear RoomBeds and RoomAdmission tables before running this migration. Use: TRUNCATE TABLE "RoomAdmission" CASCADE; TRUNCATE TABLE "RoomBeds" CASCADE;';
        END IF;
        
        -- Step 1: Drop foreign key constraints in RoomAdmission that reference RoomBedsId
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'RoomAdmission_RoomBedsId_fkey'
        ) THEN
            ALTER TABLE "RoomAdmission" 
            DROP CONSTRAINT "RoomAdmission_RoomBedsId_fkey";
            RAISE NOTICE 'Dropped RoomAdmission_RoomBedsId_fkey constraint';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'RoomAdmission_ShiftedTo_fkey'
        ) THEN
            ALTER TABLE "RoomAdmission" 
            DROP CONSTRAINT "RoomAdmission_ShiftedTo_fkey";
            RAISE NOTICE 'Dropped RoomAdmission_ShiftedTo_fkey constraint';
        END IF;
        
        -- Step 2: Change RoomAdmission columns from UUID to INTEGER
        ALTER TABLE "RoomAdmission" 
        ALTER COLUMN "RoomBedsId" DROP NOT NULL;
        
        ALTER TABLE "RoomAdmission" 
        ALTER COLUMN "RoomBedsId" TYPE INTEGER USING NULL;
        
        ALTER TABLE "RoomAdmission" 
        ALTER COLUMN "RoomBedsId" SET NOT NULL;
        
        ALTER TABLE "RoomAdmission" 
        ALTER COLUMN "ShiftedTo" TYPE INTEGER USING NULL;
        
        RAISE NOTICE 'Changed RoomAdmission columns to INTEGER';
        
        -- Step 3: Drop the primary key constraint on RoomBeds
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'RoomBeds_pkey'
        ) THEN
            ALTER TABLE "RoomBeds" 
            DROP CONSTRAINT "RoomBeds_pkey";
            RAISE NOTICE 'Dropped RoomBeds_pkey constraint';
        END IF;
        
        -- Step 4: Change RoomBedsId from UUID to SERIAL (INTEGER with auto-increment)
        -- First, drop the default if it exists
        ALTER TABLE "RoomBeds" 
        ALTER COLUMN "RoomBedsId" DROP DEFAULT;
        
        -- Change the column type (will be NULL since table is empty)
        ALTER TABLE "RoomBeds" 
        ALTER COLUMN "RoomBedsId" DROP NOT NULL;
        
        ALTER TABLE "RoomBeds" 
        ALTER COLUMN "RoomBedsId" TYPE INTEGER USING NULL;
        
        -- Create a sequence for RoomBedsId
        CREATE SEQUENCE IF NOT EXISTS "RoomBeds_RoomBedsId_seq";
        
        -- Set the default to use the sequence
        ALTER TABLE "RoomBeds" 
        ALTER COLUMN "RoomBedsId" SET DEFAULT nextval('"RoomBeds_RoomBedsId_seq"');
        
        -- Set NOT NULL constraint
        ALTER TABLE "RoomBeds" 
        ALTER COLUMN "RoomBedsId" SET NOT NULL;
        
        -- Set the sequence owner
        ALTER SEQUENCE "RoomBeds_RoomBedsId_seq" OWNED BY "RoomBeds"."RoomBedsId";
        
        -- Recreate the primary key
        ALTER TABLE "RoomBeds" 
        ADD CONSTRAINT "RoomBeds_pkey" PRIMARY KEY ("RoomBedsId");
        
        RAISE NOTICE 'Changed RoomBedsId to INTEGER with SERIAL sequence';
        
        -- Step 5: Recreate foreign key constraints
        ALTER TABLE "RoomAdmission" 
        ADD CONSTRAINT "RoomAdmission_RoomBedsId_fkey"
        FOREIGN KEY ("RoomBedsId") 
        REFERENCES "RoomBeds"("RoomBedsId") 
        ON DELETE RESTRICT;
        
        ALTER TABLE "RoomAdmission" 
        ADD CONSTRAINT "RoomAdmission_ShiftedTo_fkey"
        FOREIGN KEY ("ShiftedTo") 
        REFERENCES "RoomBeds"("RoomBedsId") 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Recreated foreign key constraints';
        
        RAISE NOTICE 'Migration completed: RoomBedsId is now INTEGER';
    END IF;
END $$;
