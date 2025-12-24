-- Migration: Update DailyOrHourlyVitals constraints to use 'Daily Vitals' and 'Hourly Vitals'
-- This updates both PatientAdmitVisitVitals and ICUVisitVitals tables

DO $$
BEGIN
    -- First, update existing data to use the new format
    UPDATE "PatientAdmitVisitVitals"
    SET "DailyOrHourlyVitals" = 'Daily Vitals'
    WHERE "DailyOrHourlyVitals" = 'Daily';

    UPDATE "PatientAdmitVisitVitals"
    SET "DailyOrHourlyVitals" = 'Hourly Vitals'
    WHERE "DailyOrHourlyVitals" = 'Hourly';

    UPDATE "ICUVisitVitals"
    SET "DailyOrHourlyVitals" = 'Daily Vitals'
    WHERE "DailyOrHourlyVitals" = 'Daily';

    UPDATE "ICUVisitVitals"
    SET "DailyOrHourlyVitals" = 'Hourly Vitals'
    WHERE "DailyOrHourlyVitals" = 'Hourly';

    RAISE NOTICE 'Updated existing data to use new DailyOrHourlyVitals format';

    -- Update PatientAdmitVisitVitals constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'PatientAdmitVisitVitals_DailyOrHourlyVitals_check'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE "PatientAdmitVisitVitals" DROP CONSTRAINT "PatientAdmitVisitVitals_DailyOrHourlyVitals_check";
        RAISE NOTICE 'Dropped old PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint';
    END IF;

    -- Add the new constraint
    ALTER TABLE "PatientAdmitVisitVitals"
    ADD CONSTRAINT "PatientAdmitVisitVitals_DailyOrHourlyVitals_check"
    CHECK ("DailyOrHourlyVitals" IN ('Daily Vitals', 'Hourly Vitals'));
    RAISE NOTICE 'Added new PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint';

    -- Update ICUVisitVitals constraint
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ICUVisitVitals_DailyOrHourlyVitals_check'
    ) THEN
        -- Drop the old constraint
        ALTER TABLE "ICUVisitVitals" DROP CONSTRAINT "ICUVisitVitals_DailyOrHourlyVitals_check";
        RAISE NOTICE 'Dropped old ICUVisitVitals_DailyOrHourlyVitals_check constraint';
    END IF;

    -- Add the new constraint
    ALTER TABLE "ICUVisitVitals"
    ADD CONSTRAINT "ICUVisitVitals_DailyOrHourlyVitals_check"
    CHECK ("DailyOrHourlyVitals" IN ('Daily Vitals', 'Hourly Vitals'));
    RAISE NOTICE 'Added new ICUVisitVitals_DailyOrHourlyVitals_check constraint';

END $$;