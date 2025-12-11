-- Migration: Reset ICUVisitVitals table
-- Drops existing ICUVisitVitals and recreates with new schema

DO $$
BEGIN
    -- Drop table if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ICUVisitVitals'
    ) THEN
        DROP TABLE "ICUVisitVitals" CASCADE;
        RAISE NOTICE 'Dropped existing ICUVisitVitals table';
    END IF;

    -- Recreate table
    CREATE TABLE "ICUVisitVitals" (
        "ICUVisitVitalsId" UUID PRIMARY KEY,
        "ICUAdmissionId" UUID NOT NULL,
        "PatientId" UUID NOT NULL,
        "NurseId" INTEGER,
        "NurseVisitsDetails" TEXT,
        "PatientCondition" VARCHAR(50) CHECK ("PatientCondition" IN ('Stable', 'Notstable')),
        "DailyOrHourlyVitals" VARCHAR(50) CHECK ("DailyOrHourlyVitals" IN ('Daily', 'Hourly')),
        "RecordedDateTime" TIMESTAMP NOT NULL,
        "HeartRate" VARCHAR(50),
        "BloodPressure" VARCHAR(50),
        "Temperature" VARCHAR(50),
        "O2Saturation" VARCHAR(50),
        "RespiratoryRate" VARCHAR(50),
        "PulseRate" VARCHAR(50),
        "VitalsRemarks" TEXT,
        "VitalsCreatedBy" INTEGER,
        "VitalsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'InActive')),
        FOREIGN KEY ("ICUAdmissionId") REFERENCES "PatientICUAdmission"("PatientICUAdmissionId") ON DELETE RESTRICT,
        FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
        FOREIGN KEY ("VitalsCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_icuadmissionid ON "ICUVisitVitals"("ICUAdmissionId");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_patientid ON "ICUVisitVitals"("PatientId");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_nurseid ON "ICUVisitVitals"("NurseId");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_dailyorhourlyvitals ON "ICUVisitVitals"("DailyOrHourlyVitals");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_patientcondition ON "ICUVisitVitals"("PatientCondition");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_recordeddatetime ON "ICUVisitVitals"("RecordedDateTime");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_vitalsstatus ON "ICUVisitVitals"("VitalsStatus");
    CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_status ON "ICUVisitVitals"("Status");

    RAISE NOTICE 'ICUVisitVitals table recreated successfully';
END $$;

