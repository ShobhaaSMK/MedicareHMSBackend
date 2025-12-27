-- Migration: Change BillId from VARCHAR to INTEGER in Bills and BillItems tables
-- Date: 2024
-- Description: Update BillId column type to INTEGER for better performance and consistency

-- First, ensure no invalid data exists in BillId columns
-- Check Bills table
DO $$
BEGIN
    -- Check if Bills table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Bills') THEN
        -- Check for non-numeric values in BillId column
        IF EXISTS (
            SELECT 1 FROM "Bills"
            WHERE "BillId" IS NOT NULL
            AND "BillId" !~ '^[0-9]+$'
        ) THEN
            RAISE EXCEPTION 'Bills table contains non-numeric BillId values. Please clean up data before running this migration.';
        END IF;
    END IF;
END $$;

-- Check BillItems table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BillItems') THEN
        -- Check for non-numeric values in BillId column
        IF EXISTS (
            SELECT 1 FROM "BillItems"
            WHERE "BillId" IS NOT NULL
            AND "BillId" !~ '^[0-9]+$'
        ) THEN
            RAISE EXCEPTION 'BillItems table contains non-numeric BillId values. Please clean up data before running this migration.';
        END IF;
    END IF;
END $$;

-- Alter Bills table BillId column to INTEGER
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Bills') THEN
        ALTER TABLE "Bills" ALTER COLUMN "BillId" TYPE INTEGER USING "BillId"::INTEGER;
        RAISE NOTICE 'Bills.BillId column type changed to INTEGER';
    ELSE
        RAISE NOTICE 'Bills table does not exist, skipping...';
    END IF;
END $$;

-- Alter BillItems table BillId column to INTEGER
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BillItems') THEN
        ALTER TABLE "BillItems" ALTER COLUMN "BillId" TYPE INTEGER USING "BillId"::INTEGER;
        RAISE NOTICE 'BillItems.BillId column type changed to INTEGER';
    ELSE
        RAISE NOTICE 'BillItems table does not exist, skipping...';
    END IF;
END $$;

-- Add sequence for Bills table if it doesn't exist and BillId is the primary key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Bills') THEN
        -- Check if BillId is the primary key
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'Bills'
            AND tc.constraint_type = 'PRIMARY KEY'
            AND kcu.column_name = 'BillId'
        ) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name = 'bills_billid_seq') THEN
                CREATE SEQUENCE bills_billid_seq;
                ALTER TABLE "Bills" ALTER COLUMN "BillId" SET DEFAULT nextval('bills_billid_seq');
                ALTER SEQUENCE bills_billid_seq OWNED BY "Bills"."BillId";
                RAISE NOTICE 'Created sequence for Bills.BillId';
            END IF;
        END IF;
    END IF;
END $$;

-- Add sequence for BillItems table if BillItemsId exists and is the primary key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BillItems') THEN
        -- Check if BillItemsId column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'BillItems'
            AND column_name = 'BillItemsId'
        ) THEN
            -- Check if BillItemsId is the primary key
            IF EXISTS (
                SELECT 1 FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_schema = 'public'
                AND tc.table_name = 'BillItems'
                AND tc.constraint_type = 'PRIMARY KEY'
                AND kcu.column_name = 'BillItemsId'
            ) THEN
                IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name = 'billitems_billitemsid_seq') THEN
                    CREATE SEQUENCE billitems_billitemsid_seq;
                    ALTER TABLE "BillItems" ALTER COLUMN "BillItemsId" SET DEFAULT nextval('billitems_billitemsid_seq');
                    ALTER SEQUENCE billitems_billitemsid_seq OWNED BY "BillItems"."BillItemsId";
                    RAISE NOTICE 'Created sequence for BillItems.BillItemsId';
                END IF;
            END IF;
        END IF;
    END IF;
END $$;

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Bills') THEN
        RAISE NOTICE 'Bills.BillId column type: %', (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Bills' AND column_name = 'BillId');
    ELSE
        RAISE NOTICE 'Bills table does not exist';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'BillItems') THEN
        RAISE NOTICE 'BillItems.BillId column type: %', (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'BillItems' AND column_name = 'BillId');
    ELSE
        RAISE NOTICE 'BillItems table does not exist';
    END IF;
END $$;
