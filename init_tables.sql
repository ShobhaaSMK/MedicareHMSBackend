-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS "Roles" (
    "RoleId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RoleName" VARCHAR(255) NOT NULL UNIQUE,
    "RoleDescription" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DoctorDepartment table
CREATE TABLE IF NOT EXISTS "DoctorDepartment" (
    "DoctorDepartmentId" SERIAL PRIMARY KEY,
    "DepartmentName" VARCHAR(255) NOT NULL UNIQUE,
    "DepartmentCategory" VARCHAR(50) CHECK ("DepartmentCategory" IN ('Clinical', 'Surgical', 'Diagnostic', 'Critical Care', 'Support')),
    "SpecialisationDetails" TEXT,
    "NoOfDoctors" INTEGER DEFAULT 0,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS "Users" (
    "UserId" SERIAL PRIMARY KEY,
    "RoleId" UUID NOT NULL,
    "UserName" VARCHAR(255) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "PhoneNo" VARCHAR(20),
    "EmailId" VARCHAR(255),
    "DoctorDepartmentId" INTEGER,
    "DoctorQualification" TEXT,
    "DoctorType" VARCHAR(50) CHECK ("DoctorType" IN ('INHOUSE', 'VISITING')),
    "DoctorOPDCharge" DECIMAL(10, 2),
    "DoctorSurgeryCharge" DECIMAL(10, 2),
    "OPDConsultation" VARCHAR(10) CHECK ("OPDConsultation" IN ('Yes', 'No')),
    "IPDVisit" VARCHAR(10) CHECK ("IPDVisit" IN ('Yes', 'No')),
    "OTHandle" VARCHAR(10) CHECK ("OTHandle" IN ('Yes', 'No')),
    "ICUVisits" VARCHAR(10) CHECK ("ICUVisits" IN ('Yes', 'No')),
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("RoleId") REFERENCES "Roles"("RoleId") ON DELETE RESTRICT,
    FOREIGN KEY ("DoctorDepartmentId") REFERENCES "DoctorDepartment"("DoctorDepartmentId") ON DELETE SET NULL,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "PatientRegistration" (
    "PatientId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "PatientNo" VARCHAR(50) NOT NULL UNIQUE,
    "PatientName" VARCHAR(255) NOT NULL,
    "LastName" VARCHAR(255),
    "PhoneNo" VARCHAR(20) NOT NULL,
    "Gender" VARCHAR(10),
    "Age" INTEGER,
    "Address" TEXT,
    "AdhaarID" VARCHAR(12) UNIQUE,
    "PANCard" VARCHAR(10),
    "PatientType" VARCHAR(50),
    "ChiefComplaint" TEXT,
    "Description" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "RegisteredBy" INTEGER,
    "RegisteredDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RoomBeds table
CREATE TABLE IF NOT EXISTS "RoomBeds" (
    "RoomBedsId" SERIAL PRIMARY KEY,
    "BedNo" VARCHAR(50) NOT NULL UNIQUE,
    "RoomNo" VARCHAR(50),
    "RoomCategory" VARCHAR(50) NOT NULL CHECK ("RoomCategory" IN ('AC', 'Non AC')),
    "RoomType" VARCHAR(50) NOT NULL CHECK ("RoomType" IN ('Special', 'Special Shared', 'Regular')),
    "ChargesPerDay" DECIMAL(10, 2) NOT NULL,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Create indexes for RoomBeds
CREATE INDEX IF NOT EXISTS idx_roombeds_bedno ON "RoomBeds"("BedNo");
CREATE INDEX IF NOT EXISTS idx_roombeds_roomno ON "RoomBeds"("RoomNo");
CREATE INDEX IF NOT EXISTS idx_roombeds_roomcategory ON "RoomBeds"("RoomCategory");
CREATE INDEX IF NOT EXISTS idx_roombeds_roomtype ON "RoomBeds"("RoomType");
CREATE INDEX IF NOT EXISTS idx_roombeds_status ON "RoomBeds"("Status");
CREATE INDEX IF NOT EXISTS idx_roombeds_createdby ON "RoomBeds"("CreatedBy");

-- LabTest table
CREATE TABLE IF NOT EXISTS "LabTest" (
    "LabTestId" SERIAL PRIMARY KEY,
    "DisplayTestId" VARCHAR(100) NOT NULL UNIQUE,
    "TestName" VARCHAR(255) NOT NULL,
    "TestCategory" VARCHAR(255) NOT NULL,
    "Description" TEXT,
    "Charges" DECIMAL(10, 2) NOT NULL,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ICU" (
    "ICUId" SERIAL PRIMARY KEY,
    "ICUBedNo" VARCHAR(50) NOT NULL UNIQUE,
    "ICUType" VARCHAR(100),
    "ICURoomNameNo" VARCHAR(100),
    "ICUDescription" TEXT,
    "IsVentilatorAttached" VARCHAR(10) NOT NULL CHECK ("IsVentilatorAttached" IN ('Yes', 'No')),
    "ICUStartTimeofDay" TIME,
    "ICUEndTimeofDay" TIME,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- BillEntity table
CREATE TABLE IF NOT EXISTS "BillEntity" (
    "BillEntityId" SERIAL PRIMARY KEY,
    "BillEntity" VARCHAR(50) NOT NULL CHECK ("BillEntity" IN ('OPD_VISIT', 'LAB', 'IPD_ADMISSION', 'OT_CASE', 'ICU_STAY', 'PHARMACY')),
    "EntityDescription" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "BillEntityCreatedBy" INTEGER,
    "BillEntityCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("BillEntityCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_billentity_billentity ON "BillEntity"("BillEntity");
CREATE INDEX IF NOT EXISTS idx_billentity_status ON "BillEntity"("Status");
CREATE INDEX IF NOT EXISTS idx_billentity_createdby ON "BillEntity"("BillEntityCreatedBy");

-- Bills table
CREATE TABLE IF NOT EXISTS "Bills" (
    "BillId" SERIAL PRIMARY KEY,
    "BillNo" VARCHAR(50) NOT NULL UNIQUE,
    "PatientId" UUID,
    "BillEntityId" INTEGER NOT NULL,
    "ServiceId" VARCHAR(100),
    "Quantity" DECIMAL(10, 2) DEFAULT 1,
    "Rate" DECIMAL(10, 2) NOT NULL,
    "Amount" DECIMAL(10, 2) NOT NULL,
    "BillDateTime" TIMESTAMP NOT NULL,
    "ModeOfPayment" VARCHAR(50) CHECK ("ModeOfPayment" IN ('Cash', 'Card', 'Insurance', 'Scheme')),
    "InsuranceReferenceNo" VARCHAR(100),
    "InsuranceBillAmount" DECIMAL(10, 2),
    "SchemeReferenceNo" VARCHAR(100),
    "PaidStatus" VARCHAR(50) CHECK ("PaidStatus" IN ('Paid', 'NotPaid')) DEFAULT 'NotPaid',
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "BillGeneratedBy" INTEGER,
    "BillGeneratedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE SET NULL,
    FOREIGN KEY ("BillEntityId") REFERENCES "BillEntity"("BillEntityId") ON DELETE RESTRICT,
    FOREIGN KEY ("BillGeneratedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bills_billno ON "Bills"("BillNo");
CREATE INDEX IF NOT EXISTS idx_bills_patientid ON "Bills"("PatientId");
CREATE INDEX IF NOT EXISTS idx_bills_billentityid ON "Bills"("BillEntityId");
CREATE INDEX IF NOT EXISTS idx_bills_billdatetime ON "Bills"("BillDateTime");
CREATE INDEX IF NOT EXISTS idx_bills_paidstatus ON "Bills"("PaidStatus");
CREATE INDEX IF NOT EXISTS idx_bills_status ON "Bills"("Status");
CREATE INDEX IF NOT EXISTS idx_bills_generatedby ON "Bills"("BillGeneratedBy");

-- EmergencyBed table
CREATE TABLE IF NOT EXISTS "EmergencyBed" (
    "EmergencyBedId" SERIAL PRIMARY KEY,
    "EmergencyBedNo" VARCHAR(50) NOT NULL UNIQUE,
    "EmergencyRoomNameNo" VARCHAR(100),
    "EmergencyRoomDescription" TEXT,
    "ChargesPerDay" DECIMAL(10, 2),
    "Status" VARCHAR(50) DEFAULT 'Unoccupied' CHECK ("Status" IN ('Active', 'Inactive', 'Occupied', 'Unoccupied')),
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- EmergencyBedSlot table
CREATE TABLE IF NOT EXISTS "EmergencyBedSlot" (
    "EmergencyBedSlotId" SERIAL PRIMARY KEY,
    "EmergencyBedId" INTEGER NOT NULL,
    "EBedSlotNo" VARCHAR(50) NOT NULL UNIQUE,
    "ESlotStartTime" TIME NOT NULL,
    "ESlotEndTime" TIME NOT NULL,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("EmergencyBedId") REFERENCES "EmergencyBed"("EmergencyBedId") ON DELETE RESTRICT
);

-- Create indexes for EmergencyBedSlot
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_emergencybedid ON "EmergencyBedSlot"("EmergencyBedId");
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_ebedslotno ON "EmergencyBedSlot"("EBedSlotNo");
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_status ON "EmergencyBedSlot"("Status");
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_slotstarttime ON "EmergencyBedSlot"("ESlotStartTime");
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_slotendtime ON "EmergencyBedSlot"("ESlotEndTime");
CREATE INDEX IF NOT EXISTS idx_emergencybedslot_slottime ON "EmergencyBedSlot"("EmergencyBedId", "ESlotStartTime", "ESlotEndTime");

-- OT (Operation Theater) table
CREATE TABLE IF NOT EXISTS "OT" (
    "OTId" SERIAL PRIMARY KEY,
    "OTNo" VARCHAR(50) NOT NULL UNIQUE,
    "OTType" VARCHAR(100),
    "OTName" VARCHAR(255),
    "OTDescription" TEXT,
    "OTStartTimeofDay" TIME,
    "OTEndTimeofDay" TIME,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- OTSlot table
CREATE TABLE IF NOT EXISTS "OTSlot" (
    "OTSlotId" SERIAL PRIMARY KEY,
    "OTId" INTEGER NOT NULL,
    "OTSlotNo" INTEGER NOT NULL,
    "SlotStartTime" TIME NOT NULL,
    "SlotEndTime" TIME NOT NULL,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'InActive')),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("OTId") REFERENCES "OT"("OTId") ON DELETE RESTRICT,
    UNIQUE ("OTId", "OTSlotNo")
);

-- Create indexes for OTSlot
CREATE INDEX IF NOT EXISTS idx_otslot_otid ON "OTSlot"("OTId");
CREATE INDEX IF NOT EXISTS idx_otslot_status ON "OTSlot"("Status");
CREATE INDEX IF NOT EXISTS idx_otslot_slotstarttime ON "OTSlot"("SlotStartTime");
CREATE INDEX IF NOT EXISTS idx_otslot_slotendtime ON "OTSlot"("SlotEndTime");
CREATE INDEX IF NOT EXISTS idx_otslot_slottime ON "OTSlot"("OTId", "SlotStartTime", "SlotEndTime");

CREATE TABLE IF NOT EXISTS "PatientAppointment" (
    "PatientAppointmentId" SERIAL PRIMARY KEY,
    "PatientId" UUID NOT NULL,
    "DoctorId" INTEGER NOT NULL,
    "AppointmentDate" DATE NOT NULL,
    "AppointmentTime" TIME NOT NULL,
    "TokenNo" VARCHAR(20) NOT NULL UNIQUE,
    "AppointmentStatus" VARCHAR(50) DEFAULT 'Waiting',
    "ConsultationCharge" DECIMAL(10, 2),
    "Diagnosis" TEXT,
    "FollowUpDetails" TEXT,
    "PrescriptionsUrl" TEXT,
    "ToBeAdmitted" VARCHAR(10) DEFAULT 'No' CHECK ("ToBeAdmitted" IN ('Yes', 'No')),
    "ReferToAnotherDoctor" VARCHAR(10) DEFAULT 'No' CHECK ("ReferToAnotherDoctor" IN ('Yes', 'No')),
    "ReferredDoctorId" INTEGER,
    "TransferToIPDOTICU" VARCHAR(10) DEFAULT 'No' CHECK ("TransferToIPDOTICU" IN ('Yes', 'No')),
    "TransferTo" VARCHAR(50) CHECK ("TransferTo" IN ('IPD Room Admission', 'ICU', 'OT')),
    "TransferDetails" TEXT,
    "BillId" INTEGER,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("DoctorId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("ReferredDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL,
    FOREIGN KEY ("BillId") REFERENCES "Bills"("BillId") ON DELETE SET NULL,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- PatientICUAdmission table
CREATE TABLE IF NOT EXISTS "PatientICUAdmission" (
    "PatientICUAdmissionId" UUID PRIMARY KEY,
    "PatientId" UUID NOT NULL,
    "PatientAppointmentId" INTEGER,
    "EmergencyAdmissionId" INTEGER,
    "RoomAdmissionId" INTEGER,
    "PatientType" VARCHAR(50) CHECK ("PatientType" IN ('OPD', 'IPD', 'Emergency', 'Direct')),
    "ICUId" INTEGER NOT NULL,
    "ICUPatientStatus" VARCHAR(50),
    "ICUAdmissionStatus" VARCHAR(50) DEFAULT 'Occupied' CHECK ("ICUAdmissionStatus" IN ('Occupied', 'Discharged')),
    "ICUAllocationFromDate" DATE,
    "ICUAllocationToDate" DATE,
    "NumberOfDays" INTEGER,
    "Diagnosis" TEXT,
    "TreatementDetails" TEXT,
    "PatientCondition" TEXT,
    "ICUAllocationCreatedBy" INTEGER,
    "ICUAllocationCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "OnVentilator" VARCHAR(10) DEFAULT 'No' CHECK ("OnVentilator" IN ('Yes', 'No')),
    "AttendingDoctorId" INTEGER,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientAppointmentId") REFERENCES "PatientAppointment"("PatientAppointmentId") ON DELETE SET NULL,
    FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("ICUId") REFERENCES "ICU"("ICUId") ON DELETE RESTRICT,
    FOREIGN KEY ("ICUAllocationCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL,
    FOREIGN KEY ("AttendingDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- RoomAdmission table
CREATE TABLE IF NOT EXISTS "RoomAdmission" (
    "RoomAdmissionId" SERIAL PRIMARY KEY,
    "PatientAppointmentId" INTEGER,
    "EmergencyAdmissionId" INTEGER,
    "PatientType" VARCHAR(50) CHECK ("PatientType" IN ('OPD', 'Emergency', 'Direct')),
    "AdmittingDoctorId" INTEGER NOT NULL,
    "PatientId" UUID NOT NULL,
    "RoomBedsId" INTEGER NOT NULL,
    "RoomAllocationDate" TIMESTAMP NOT NULL,
    "RoomVacantDate" TIMESTAMP,
    "AdmissionStatus" VARCHAR(50) DEFAULT 'Active' CHECK ("AdmissionStatus" IN ('Active', 'Moved to ICU', 'Surgery Scheduled', 'Discharged')),
    "CaseSheetDetails" TEXT,
    "CaseSheet" TEXT,
    "ShiftToAnotherRoom" VARCHAR(10) DEFAULT 'No' CHECK ("ShiftToAnotherRoom" IN ('Yes', 'No')),
    "ShiftedTo" INTEGER,
    "ShiftedToDetails" TEXT,
    "ScheduleOT" VARCHAR(10) DEFAULT 'No' CHECK ("ScheduleOT" IN ('Yes', 'No')),
    "OTAdmissionId" INTEGER,
    "IsLinkedToICU" VARCHAR(10) DEFAULT 'No' CHECK ("IsLinkedToICU" IN ('Yes', 'No')),
    "ICUAdmissionId" UUID,
    "BillId" INTEGER,
    "AllocatedBy" INTEGER,
    "AllocatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    FOREIGN KEY ("PatientAppointmentId") REFERENCES "PatientAppointment"("PatientAppointmentId") ON DELETE SET NULL,
    FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("AdmittingDoctorId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("RoomBedsId") REFERENCES "RoomBeds"("RoomBedsId") ON DELETE RESTRICT,
    FOREIGN KEY ("ShiftedTo") REFERENCES "RoomBeds"("RoomBedsId") ON DELETE SET NULL,
    FOREIGN KEY ("ICUAdmissionId") REFERENCES "PatientICUAdmission"("PatientICUAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("BillId") REFERENCES "Bills"("BillId") ON DELETE SET NULL,
    FOREIGN KEY ("AllocatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add OTAdmissionId foreign key constraint after PatientOTAllocation is created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PatientOTAllocation'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'PatientOTAllocation' 
            AND column_name = 'PatientOTAllocationId'
        )
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'RoomAdmission_OTAdmissionId_fkey'
        ) THEN
            ALTER TABLE "RoomAdmission" 
            ADD CONSTRAINT "RoomAdmission_OTAdmissionId_fkey" 
            FOREIGN KEY ("OTAdmissionId") REFERENCES "PatientOTAllocation"("PatientOTAllocationId") ON DELETE SET NULL;
            RAISE NOTICE 'Added RoomAdmission_OTAdmissionId_fkey constraint';
        END IF;
    END IF;
END $$;

-- Create indexes for RoomAdmission
CREATE INDEX IF NOT EXISTS idx_roomadmission_patientid ON "RoomAdmission"("PatientId");
CREATE INDEX IF NOT EXISTS idx_roomadmission_patientappointmentid ON "RoomAdmission"("PatientAppointmentId");
CREATE INDEX IF NOT EXISTS idx_roomadmission_admittingdoctorid ON "RoomAdmission"("AdmittingDoctorId");
CREATE INDEX IF NOT EXISTS idx_roomadmission_roombedsid ON "RoomAdmission"("RoomBedsId");
CREATE INDEX IF NOT EXISTS idx_roomadmission_admissionstatus ON "RoomAdmission"("AdmissionStatus");
CREATE INDEX IF NOT EXISTS idx_roomadmission_status ON "RoomAdmission"("Status");
CREATE INDEX IF NOT EXISTS idx_roomadmission_allocationdate ON "RoomAdmission"("RoomAllocationDate");

-- Add foreign key from PatientICUAdmission to RoomAdmission (after RoomAdmission is created)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientICUAdmission_RoomAdmissionId_fkey'
    ) THEN
        ALTER TABLE "PatientICUAdmission" 
        ADD COLUMN IF NOT EXISTS "RoomAdmissionId" INTEGER,
        ADD CONSTRAINT "PatientICUAdmission_RoomAdmissionId_fkey" 
        FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL;
    END IF;
END $$;

-- PatientLabTest table
CREATE TABLE IF NOT EXISTS "PatientLabTest" (
    "PatientLabTestsId" SERIAL PRIMARY KEY,
    "PatientType" VARCHAR(50) NOT NULL,
    "PatientId" UUID NOT NULL,
    "LabTestId" INTEGER NOT NULL,
    "AppointmentId" INTEGER,
    "RoomAdmissionId" INTEGER,
    "EmergencyAdmissionId" INTEGER,
    "BillId" INTEGER,
    "OrderedByDoctorId" INTEGER,
    "Priority" VARCHAR(50) CHECK ("Priority" IN ('Normal', 'Urgent')),
    "LabTestDone" VARCHAR(10) DEFAULT 'No',
    "ReportsUrl" TEXT,
    "TestStatus" VARCHAR(50) CHECK ("TestStatus" IN ('Pending', 'InProgress', 'Completed')),
    "TestDoneDateTime" TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "CreatedBy" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("LabTestId") REFERENCES "LabTest"("LabTestId") ON DELETE RESTRICT,
    FOREIGN KEY ("AppointmentId") REFERENCES "PatientAppointment"("PatientAppointmentId") ON DELETE SET NULL,
    FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("BillId") REFERENCES "Bills"("BillId") ON DELETE SET NULL
);

-- Add missing columns to PatientLabTest if table exists but columns don't
DO $$
BEGIN
    -- Only proceed if PatientLabTest table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest'
    ) THEN
        -- Add RoomAdmissionId column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'RoomAdmissionId'
        ) THEN
            ALTER TABLE "PatientLabTest" ADD COLUMN "RoomAdmissionId" INTEGER;
            
            -- Add foreign key constraint if RoomAdmission table exists
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'RoomAdmission'
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'PatientLabTest_RoomAdmissionId_fkey'
            ) THEN
                ALTER TABLE "PatientLabTest" 
                ADD CONSTRAINT "PatientLabTest_RoomAdmissionId_fkey" 
                FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL;
            END IF;
        END IF;
        
        -- Add OrderedByDoctorId column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'OrderedByDoctorId'
        ) THEN
            ALTER TABLE "PatientLabTest" ADD COLUMN "OrderedByDoctorId" INTEGER;
            RAISE NOTICE 'Added OrderedByDoctorId column to PatientLabTest';
        END IF;
        
        -- Ensure OrderedByDoctorId foreign key constraint exists (for new or existing tables)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'OrderedByDoctorId'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Users'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'PatientLabTest_OrderedByDoctorId_fkey'
        ) THEN
            -- Clean up any invalid foreign key references before adding constraint
            -- Only if column is INTEGER type
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'PatientLabTest' 
                AND column_name = 'OrderedByDoctorId'
                AND data_type = 'integer'
            ) THEN
                UPDATE "PatientLabTest" 
                SET "OrderedByDoctorId" = NULL 
                WHERE "OrderedByDoctorId" IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM "Users" WHERE "UserId" = "PatientLabTest"."OrderedByDoctorId"
                );
            END IF;
            
            ALTER TABLE "PatientLabTest" 
            ADD CONSTRAINT "PatientLabTest_OrderedByDoctorId_fkey" 
            FOREIGN KEY ("OrderedByDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
            RAISE NOTICE 'Added PatientLabTest_OrderedByDoctorId_fkey constraint';
        END IF;
        
        -- Ensure CreatedBy foreign key constraint exists (for new or existing tables)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'CreatedBy'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Users'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'PatientLabTest_CreatedBy_fkey'
        ) THEN
            -- Check if CreatedBy is INTEGER type, if not, it needs to be converted first
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'PatientLabTest' 
                AND column_name = 'CreatedBy'
                AND data_type = 'integer'
            ) THEN
                -- Clean up any invalid foreign key references before adding constraint
                UPDATE "PatientLabTest" 
                SET "CreatedBy" = NULL 
                WHERE "CreatedBy" IS NOT NULL 
                AND NOT EXISTS (
                    SELECT 1 FROM "Users" WHERE "UserId" = "PatientLabTest"."CreatedBy"
                );
                
                ALTER TABLE "PatientLabTest" 
                ADD CONSTRAINT "PatientLabTest_CreatedBy_fkey" 
                FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL;
                RAISE NOTICE 'Added PatientLabTest_CreatedBy_fkey constraint';
            ELSE
                -- CreatedBy is not INTEGER, skip constraint creation
                -- User should run the migration change_createdby_to_integer_patient_lab_test.sql first
                RAISE NOTICE 'CreatedBy column is not INTEGER type. Please run migration change_createdby_to_integer_patient_lab_test.sql first.';
            END IF;
        END IF;
        
        -- Migrate EmergencyBedSlotId to EmergencyAdmissionId if old column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'EmergencyBedSlotId'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'EmergencyAdmissionId'
        ) THEN
            -- Drop old foreign key constraint if it exists
            IF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'PatientLabTest_EmergencyBedSlotId_fkey'
            ) THEN
                ALTER TABLE "PatientLabTest" 
                DROP CONSTRAINT "PatientLabTest_EmergencyBedSlotId_fkey";
                RAISE NOTICE 'Dropped old PatientLabTest_EmergencyBedSlotId_fkey constraint';
            END IF;
            
            -- Rename the column
            ALTER TABLE "PatientLabTest" 
            RENAME COLUMN "EmergencyBedSlotId" TO "EmergencyAdmissionId";
            RAISE NOTICE 'Renamed EmergencyBedSlotId to EmergencyAdmissionId in PatientLabTest';
            
            -- Add new foreign key constraint
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'EmergencyAdmission'
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'PatientLabTest_EmergencyAdmissionId_fkey'
            ) THEN
                ALTER TABLE "PatientLabTest" 
                ADD CONSTRAINT "PatientLabTest_EmergencyAdmissionId_fkey" 
                FOREIGN KEY ("EmergencyAdmissionId") 
                REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") 
                ON DELETE SET NULL;
                RAISE NOTICE 'Added PatientLabTest_EmergencyAdmissionId_fkey constraint';
            END IF;
        END IF;
        
        -- Add EmergencyAdmissionId column if it doesn't exist (for new tables)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'EmergencyAdmissionId'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'PatientLabTest' 
            AND column_name = 'EmergencyBedSlotId'
        ) THEN
            ALTER TABLE "PatientLabTest" ADD COLUMN "EmergencyAdmissionId" INTEGER;
            RAISE NOTICE 'Added EmergencyAdmissionId column to PatientLabTest';
            
            -- Add foreign key constraint if EmergencyAdmission table exists
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'EmergencyAdmission'
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'PatientLabTest_EmergencyAdmissionId_fkey'
            ) THEN
                ALTER TABLE "PatientLabTest" 
                ADD CONSTRAINT "PatientLabTest_EmergencyAdmissionId_fkey" 
                FOREIGN KEY ("EmergencyAdmissionId") 
                REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") 
                ON DELETE SET NULL;
                RAISE NOTICE 'Added PatientLabTest_EmergencyAdmissionId_fkey constraint';
            END IF;
        END IF;
        
    END IF;
END $$;

-- SurgeryProcedure table (created before PatientOTAllocation which references it)
CREATE TABLE IF NOT EXISTS "SurgeryProcedure" (
    "SurgeryId" SERIAL PRIMARY KEY,
    "SurgeryType" VARCHAR(255),
    "SurgeryName" VARCHAR(255) NOT NULL,
    "SurgeryDetails" TEXT,
    "PreSurgerySpecifications" TEXT,
    "PostSurgerySpecifications" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "CreatedBy" INTEGER,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_surgeryprocedure_surgeryname ON "SurgeryProcedure"("SurgeryName");
CREATE INDEX IF NOT EXISTS idx_surgeryprocedure_surgerytype ON "SurgeryProcedure"("SurgeryType");
CREATE INDEX IF NOT EXISTS idx_surgeryprocedure_status ON "SurgeryProcedure"("Status");

-- PatientOTAllocation table
CREATE TABLE IF NOT EXISTS "PatientOTAllocation" (
    "PatientOTAllocationId" SERIAL PRIMARY KEY,
    "PatientId" UUID NOT NULL,
    "RoomAdmissionId" INTEGER,
    "PatientAppointmentId" INTEGER,
    "EmergencyBedSlotId" INTEGER,
    "OTId" INTEGER NOT NULL,
    "SurgeryId" INTEGER,
    "LeadSurgeonId" INTEGER NOT NULL,
    "AssistantDoctorId" INTEGER,
    "AnaesthetistId" INTEGER,
    "NurseId" INTEGER,
    "OTAllocationDate" DATE NOT NULL,
    "Duration" VARCHAR(50),
    "OTStartTime" TIME,
    "OTEndTime" TIME,
    "OTActualStartTime" TIME,
    "OTActualEndTime" TIME,
    "OperationDescription" TEXT,
    "OperationStatus" VARCHAR(50) DEFAULT 'Scheduled',
    "PreOperationNotes" TEXT,
    "PostOperationNotes" TEXT,
    "OTDocuments" TEXT,
    "BillId" INTEGER,
    "OTAllocationCreatedBy" INTEGER,
    "OTAllocationCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientAppointmentId") REFERENCES "PatientAppointment"("PatientAppointmentId") ON DELETE SET NULL,
    FOREIGN KEY ("EmergencyBedSlotId") REFERENCES "EmergencyBedSlot"("EmergencyBedSlotId") ON DELETE SET NULL,
    FOREIGN KEY ("OTId") REFERENCES "OT"("OTId") ON DELETE RESTRICT,
    FOREIGN KEY ("SurgeryId") REFERENCES "SurgeryProcedure"("SurgeryId") ON DELETE SET NULL,
    FOREIGN KEY ("LeadSurgeonId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("AssistantDoctorId") REFERENCES "Users"("UserId") ON DELETE SET NULL,
    FOREIGN KEY ("AnaesthetistId") REFERENCES "Users"("UserId") ON DELETE SET NULL,
    FOREIGN KEY ("BillId") REFERENCES "Bills"("BillId") ON DELETE SET NULL,
    FOREIGN KEY ("OTAllocationCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add NurseId foreign key to PatientOTAllocation if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientOTAllocation'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientOTAllocation' 
        AND column_name = 'NurseId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientOTAllocation_NurseId_fkey'
    ) THEN
        ALTER TABLE "PatientOTAllocation" 
        ADD CONSTRAINT "PatientOTAllocation_NurseId_fkey" 
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
    END IF;
END $$;

-- PatientOTAllocationSlots junction table (for multiple slots per allocation)
CREATE TABLE IF NOT EXISTS "PatientOTAllocationSlots" (
    "PatientOTAllocationSlotId" SERIAL PRIMARY KEY,
    "PatientOTAllocationId" INTEGER NOT NULL,
    "OTSlotId" INTEGER NOT NULL,
    "OTAllocationDate" DATE NOT NULL,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PatientOTAllocationId") REFERENCES "PatientOTAllocation"("PatientOTAllocationId") ON DELETE CASCADE,
    FOREIGN KEY ("OTSlotId") REFERENCES "OTSlot"("OTSlotId") ON DELETE RESTRICT,
    UNIQUE ("PatientOTAllocationId", "OTSlotId")
);

-- Create index on PatientOTAllocationId for faster lookups
CREATE INDEX IF NOT EXISTS idx_patientotallocationslots_allocationid 
    ON "PatientOTAllocationSlots"("PatientOTAllocationId");

-- Create index on OTSlotId for faster availability checks
CREATE INDEX IF NOT EXISTS idx_patientotallocationslots_slotid 
    ON "PatientOTAllocationSlots"("OTSlotId");

-- Add OTAdmissionId foreign key constraint to RoomAdmission (after PatientOTAllocation is created)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PatientOTAllocation'
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'PatientOTAllocation' 
            AND column_name = 'PatientOTAllocationId'
        )
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'RoomAdmission_OTAdmissionId_fkey'
        ) THEN
            ALTER TABLE "RoomAdmission" 
            ADD CONSTRAINT "RoomAdmission_OTAdmissionId_fkey" 
            FOREIGN KEY ("OTAdmissionId") REFERENCES "PatientOTAllocation"("PatientOTAllocationId") ON DELETE SET NULL;
            RAISE NOTICE 'Added RoomAdmission_OTAdmissionId_fkey constraint';
        END IF;
    END IF;
END $$;

-- EmergencyAdmission table
CREATE TABLE IF NOT EXISTS "EmergencyAdmission" (
    "EmergencyAdmissionId" SERIAL PRIMARY KEY,
    "DoctorId" INTEGER NOT NULL,
    "PatientId" UUID NOT NULL,
    "EmergencyBedId" INTEGER NOT NULL,
    "EmergencyAdmissionDate" DATE NOT NULL,
    "EmergencyStatus" VARCHAR(50) CHECK ("EmergencyStatus" IN ('Admitted', 'IPD', 'OT', 'ICU', 'Discharged')),
    "Priority" VARCHAR(50),
    "AllocationFromDate" DATE,
    "AllocationToDate" DATE,
    "NumberOfDays" INTEGER,
    "Diagnosis" TEXT,
    "TreatementDetails" TEXT,
    "PatientCondition" VARCHAR(50) CHECK ("PatientCondition" IN ('Critical', 'Stable')),
    "TransferToIPD" VARCHAR(10) DEFAULT 'No' CHECK ("TransferToIPD" IN ('Yes', 'No')),
    "TransferToOT" VARCHAR(10) DEFAULT 'No' CHECK ("TransferToOT" IN ('Yes', 'No')),
    "TransferToICU" VARCHAR(10) DEFAULT 'No' CHECK ("TransferToICU" IN ('Yes', 'No')),
    "TransferTo" VARCHAR(50) CHECK ("TransferTo" IN ('IPD', 'ICU', 'OT')),
    "TransferDetails" TEXT,
    "AdmissionCreatedBy" INTEGER,
    "AdmissionCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY ("DoctorId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("EmergencyBedId") REFERENCES "EmergencyBed"("EmergencyBedId") ON DELETE RESTRICT,
    FOREIGN KEY ("AdmissionCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- EmergencyAdmissionVitals table
CREATE TABLE IF NOT EXISTS "EmergencyAdmissionVitals" (
    "EmergencyAdmissionVitalsId" SERIAL PRIMARY KEY,
    "EmergencyAdmissionId" INTEGER NOT NULL,
    "NurseId" INTEGER NOT NULL,
    "RecordedDateTime" TIMESTAMP NOT NULL,
    "HeartRate" INTEGER,
    "BloodPressure" VARCHAR(50),
    "Temperature" DECIMAL(5, 2),
    "O2Saturation" DECIMAL(5, 2),
    "RespiratoryRate" INTEGER,
    "PulseRate" INTEGER,
    "VitalsStatus" VARCHAR(50) CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving')),
    "VitalsRemarks" TEXT,
    "VitalsCreatedBy" INTEGER,
    "VitalsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE RESTRICT,
    FOREIGN KEY ("VitalsCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add NurseId foreign key to EmergencyAdmissionVitals if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'EmergencyAdmissionVitals'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'EmergencyAdmissionVitals' 
        AND column_name = 'NurseId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'EmergencyAdmissionVitals_NurseId_fkey'
    ) THEN
        ALTER TABLE "EmergencyAdmissionVitals" 
        ADD CONSTRAINT "EmergencyAdmissionVitals_NurseId_fkey" 
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE RESTRICT;
    END IF;
END $$;

-- Create indexes for EmergencyAdmissionVitals
CREATE INDEX IF NOT EXISTS idx_emergencyadmissionvitals_emergencyadmissionid ON "EmergencyAdmissionVitals"("EmergencyAdmissionId");
-- Create NurseId index only if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'EmergencyAdmissionVitals' 
        AND column_name = 'NurseId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_emergencyadmissionvitals_nurseid ON "EmergencyAdmissionVitals"("NurseId");
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_emergencyadmissionvitals_recordeddatetime ON "EmergencyAdmissionVitals"("RecordedDateTime");
CREATE INDEX IF NOT EXISTS idx_emergencyadmissionvitals_vitalsstatus ON "EmergencyAdmissionVitals"("VitalsStatus");
CREATE INDEX IF NOT EXISTS idx_emergencyadmissionvitals_status ON "EmergencyAdmissionVitals"("Status");

-- PatientAdmitNurseVisits table
CREATE TABLE IF NOT EXISTS "PatientAdmitNurseVisits" (
    "PatientAdmitNurseVisitsId" UUID PRIMARY KEY,
    "RoomAdmissionId" INTEGER,
    "PatientId" UUID NOT NULL,
    "VisitDate" DATE NOT NULL,
    "VisitTime" TIME,
    "PatientStatus" VARCHAR(50),
    "SupervisionDetails" TEXT,
    "Remarks" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "RoomVisitsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "RoomVisitsCreatedBy" INTEGER,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("RoomVisitsCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add RoomAdmissionId foreign key to PatientAdmitNurseVisits if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitNurseVisits'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitNurseVisits' 
        AND column_name = 'RoomAdmissionId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientAdmitNurseVisits_RoomAdmissionId_fkey'
    ) THEN
        ALTER TABLE "PatientAdmitNurseVisits" 
        ADD CONSTRAINT "PatientAdmitNurseVisits_RoomAdmissionId_fkey" 
        FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL;
    END IF;
END $$;

-- ICUDoctorVisits table
CREATE TABLE IF NOT EXISTS "ICUDoctorVisits" (
    "ICUDoctorVisitsId" UUID PRIMARY KEY,
    "ICUAdmissionId" UUID NOT NULL,
    "PatientId" UUID NOT NULL,
    "DoctorId" INTEGER NOT NULL,
    "DoctorVisitedDateTime" TIMESTAMP NOT NULL,
    "VisitsDetails" TEXT,
    "PatientCondition" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    "VisitCreatedBy" INTEGER,
    "VisitCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ICUAdmissionId") REFERENCES "PatientICUAdmission"("PatientICUAdmissionId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("DoctorId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("VisitCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- ICUVisitVitals table
CREATE TABLE IF NOT EXISTS "ICUVisitVitals" (
    "ICUVisitVitalsId" UUID PRIMARY KEY,
    "ICUAdmissionId" UUID NOT NULL,
    "PatientId" UUID NOT NULL,
    "NurseId" INTEGER,
    "NurseVisitsDetails" TEXT,
    "PatientCondition" VARCHAR(50) CHECK ("PatientCondition" IN ('Stable', 'Notstable')),
    "DailyOrHourlyVitals" VARCHAR(50) CHECK ("DailyOrHourlyVitals" IN ('Daily', 'Hourly')),
    "RecordedDateTime" TIMESTAMP NOT NULL,
    "HeartRate" INTEGER,
    "BloodPressure" VARCHAR(50),
    "Temperature" DECIMAL(5, 2),
    "O2Saturation" DECIMAL(5, 2),
    "RespiratoryRate" INTEGER,
    "PulseRate" INTEGER,
    "VitalsStatus" VARCHAR(50) CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving', 'Normal')),
    "VitalsRemarks" TEXT,
    "VitalsCreatedBy" INTEGER,
    "VitalsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    FOREIGN KEY ("ICUAdmissionId") REFERENCES "PatientICUAdmission"("PatientICUAdmissionId") ON DELETE RESTRICT,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("VitalsCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add NurseId foreign key to ICUVisitVitals if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'NurseId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ICUVisitVitals_NurseId_fkey'
    ) THEN
        ALTER TABLE "ICUVisitVitals" 
        ADD CONSTRAINT "ICUVisitVitals_NurseId_fkey" 
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE RESTRICT;
    END IF;
END $$;

-- PatientAdmitDoctorVisits table
CREATE TABLE IF NOT EXISTS "PatientAdmitDoctorVisits" (
    "PatientAdmitDoctorVisitsId" UUID PRIMARY KEY,
    "RoomAdmissionId" INTEGER,
    "PatientId" UUID NOT NULL,
    "DoctorId" INTEGER NOT NULL,
    "DoctorVisitedDateTime" TIMESTAMP NOT NULL,
    "VisitsRemarks" TEXT,
    "PatientCondition" TEXT,
    "Status" VARCHAR(50) DEFAULT 'Active',
    "VisitCreatedBy" INTEGER,
    "VisitCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("DoctorId") REFERENCES "Users"("UserId") ON DELETE RESTRICT,
    FOREIGN KEY ("VisitCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add RoomAdmissionId foreign key to PatientAdmitDoctorVisits if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitDoctorVisits'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitDoctorVisits' 
        AND column_name = 'RoomAdmissionId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientAdmitDoctorVisits_RoomAdmissionId_fkey'
    ) THEN
        ALTER TABLE "PatientAdmitDoctorVisits" 
        ADD CONSTRAINT "PatientAdmitDoctorVisits_RoomAdmissionId_fkey" 
        FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL;
    END IF;
END $$;

-- PatientAdmitVisitVitals table
CREATE TABLE IF NOT EXISTS "PatientAdmitVisitVitals" (
    "PatientAdmitVisitVitalsId" UUID PRIMARY KEY,
    "RoomAdmissionId" INTEGER,
    "PatientId" UUID NOT NULL,
    "NurseId" INTEGER,
    "PatientStatus" VARCHAR(50) CHECK ("PatientStatus" IN ('Stable', 'Notstable')),
    "RecordedDateTime" TIMESTAMP NOT NULL,
    "VisitRemarks" TEXT,
    "DailyOrHourlyVitals" VARCHAR(50) CHECK ("DailyOrHourlyVitals" IN ('Daily', 'Hourly')),
    "HeartRate" INTEGER,
    "BloodPressure" VARCHAR(50),
    "Temperature" INTEGER,
    "O2Saturation" INTEGER,
    "RespiratoryRate" INTEGER,
    "PulseRate" INTEGER,
    "VitalsStatus" VARCHAR(50) CHECK ("VitalsStatus" IN ('Stable', 'Critical', 'Improving', 'Normal')),
    "VitalsRemarks" TEXT,
    "VitalsCreatedBy" INTEGER,
    "VitalsCreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active' CHECK ("Status" IN ('Active', 'Inactive')),
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE RESTRICT,
    FOREIGN KEY ("VitalsCreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Add RoomAdmissionId and NurseId foreign keys to PatientAdmitVisitVitals if columns exist
DO $$
BEGIN
    -- RoomAdmissionId foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'RoomAdmissionId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RoomAdmission'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientAdmitVisitVitals_RoomAdmissionId_fkey'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD CONSTRAINT "PatientAdmitVisitVitals_RoomAdmissionId_fkey" 
        FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL;
    END IF;
    
    -- NurseId foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'NurseId'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'PatientAdmitVisitVitals_NurseId_fkey'
    ) THEN
        ALTER TABLE "PatientAdmitVisitVitals" 
        ADD CONSTRAINT "PatientAdmitVisitVitals_NurseId_fkey" 
        FOREIGN KEY ("NurseId") REFERENCES "Users"("UserId") ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_roleid ON "Users"("RoleId");
CREATE INDEX IF NOT EXISTS idx_users_doctordepartmentid ON "Users"("DoctorDepartmentId");
CREATE INDEX IF NOT EXISTS idx_patient_registeredby ON "PatientRegistration"("RegisteredBy");
CREATE INDEX IF NOT EXISTS idx_patient_patientno ON "PatientRegistration"("PatientNo");
CREATE INDEX IF NOT EXISTS idx_patient_status ON "PatientRegistration"("Status");
CREATE INDEX IF NOT EXISTS idx_appointment_patientid ON "PatientAppointment"("PatientId");
CREATE INDEX IF NOT EXISTS idx_appointment_doctorid ON "PatientAppointment"("DoctorId");
CREATE INDEX IF NOT EXISTS idx_appointment_date ON "PatientAppointment"("AppointmentDate");
CREATE INDEX IF NOT EXISTS idx_appointment_status ON "PatientAppointment"("AppointmentStatus");
CREATE INDEX IF NOT EXISTS idx_appointment_tokenno ON "PatientAppointment"("TokenNo");
CREATE INDEX IF NOT EXISTS idx_patientlabtest_patientid ON "PatientLabTest"("PatientId");
CREATE INDEX IF NOT EXISTS idx_patientlabtest_labtestid ON "PatientLabTest"("LabTestId");
CREATE INDEX IF NOT EXISTS idx_patientlabtest_patienttype ON "PatientLabTest"("PatientType");
CREATE INDEX IF NOT EXISTS idx_patientlabtest_status ON "PatientLabTest"("Status");
CREATE INDEX IF NOT EXISTS idx_patientlabtest_teststatus ON "PatientLabTest"("TestStatus");
-- Create indexes for PatientLabTest optional columns only if they exist
DO $$
BEGIN
    -- RoomAdmissionId index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'RoomAdmissionId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patientlabtest_roomadmissionid ON "PatientLabTest"("RoomAdmissionId");
    END IF;
    
    -- OrderedByDoctorId index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'OrderedByDoctorId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patientlabtest_orderedbydoctorid ON "PatientLabTest"("OrderedByDoctorId");
    END IF;
    
    -- EmergencyAdmissionId index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'EmergencyAdmissionId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patientlabtest_emergencyadmissionid ON "PatientLabTest"("EmergencyAdmissionId");
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_doctorid ON "EmergencyAdmission"("DoctorId");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_patientid ON "EmergencyAdmission"("PatientId");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_emergencybedid ON "EmergencyAdmission"("EmergencyBedId");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_emergencystatus ON "EmergencyAdmission"("EmergencyStatus");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_status ON "EmergencyAdmission"("Status");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_admissiondate ON "EmergencyAdmission"("EmergencyAdmissionDate");
CREATE INDEX IF NOT EXISTS idx_emergencyadmission_allocationfromdate ON "EmergencyAdmission"("AllocationFromDate");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_patientid ON "PatientICUAdmission"("PatientId");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_patientappointmentid ON "PatientICUAdmission"("PatientAppointmentId");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_icuid ON "PatientICUAdmission"("ICUId");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_icupatientstatus ON "PatientICUAdmission"("ICUPatientStatus");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_status ON "PatientICUAdmission"("Status");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_allocationfromdate ON "PatientICUAdmission"("ICUAllocationFromDate");
CREATE INDEX IF NOT EXISTS idx_patienticuadmission_roomadmissionid ON "PatientICUAdmission"("RoomAdmissionId");
CREATE INDEX IF NOT EXISTS idx_icudoctorvisits_icuadmissionid ON "ICUDoctorVisits"("ICUAdmissionId");
CREATE INDEX IF NOT EXISTS idx_icudoctorvisits_patientid ON "ICUDoctorVisits"("PatientId");
CREATE INDEX IF NOT EXISTS idx_icudoctorvisits_doctorid ON "ICUDoctorVisits"("DoctorId");
CREATE INDEX IF NOT EXISTS idx_icudoctorvisits_visiteddatetime ON "ICUDoctorVisits"("DoctorVisitedDateTime");
CREATE INDEX IF NOT EXISTS idx_icudoctorvisits_status ON "ICUDoctorVisits"("Status");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_icuadmissionid ON "ICUVisitVitals"("ICUAdmissionId");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_patientid ON "ICUVisitVitals"("PatientId");
-- Create NurseId index only if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ICUVisitVitals' 
        AND column_name = 'NurseId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_nurseid ON "ICUVisitVitals"("NurseId");
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_dailyorhourlyvitals ON "ICUVisitVitals"("DailyOrHourlyVitals");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_patientcondition ON "ICUVisitVitals"("PatientCondition");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_recordeddatetime ON "ICUVisitVitals"("RecordedDateTime");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_vitalsstatus ON "ICUVisitVitals"("VitalsStatus");
CREATE INDEX IF NOT EXISTS idx_icuvisitvitals_status ON "ICUVisitVitals"("Status");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_patientid ON "PatientOTAllocation"("PatientId");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_patientappointmentid ON "PatientOTAllocation"("PatientAppointmentId");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_otid ON "PatientOTAllocation"("OTId");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_surgeryid ON "PatientOTAllocation"("SurgeryId");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_leadsurgeonid ON "PatientOTAllocation"("LeadSurgeonId");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_operationstatus ON "PatientOTAllocation"("OperationStatus");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_allocationdate ON "PatientOTAllocation"("OTAllocationDate");
CREATE INDEX IF NOT EXISTS idx_patientotallocation_status ON "PatientOTAllocation"("Status");
CREATE INDEX IF NOT EXISTS idx_patientadmitdoctorvisits_patientid ON "PatientAdmitDoctorVisits"("PatientId");
CREATE INDEX IF NOT EXISTS idx_patientadmitdoctorvisits_doctorid ON "PatientAdmitDoctorVisits"("DoctorId");
CREATE INDEX IF NOT EXISTS idx_patientadmitdoctorvisits_visiteddatetime ON "PatientAdmitDoctorVisits"("DoctorVisitedDateTime");
CREATE INDEX IF NOT EXISTS idx_patientadmitdoctorvisits_status ON "PatientAdmitDoctorVisits"("Status");
-- Create indexes for PatientAdmitVisitVitals optional columns only if they exist
DO $$
BEGIN
    -- RoomAdmissionId index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'RoomAdmissionId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_roomadmissionid ON "PatientAdmitVisitVitals"("RoomAdmissionId");
    END IF;
    
    -- NurseId index
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientAdmitVisitVitals' 
        AND column_name = 'NurseId'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_nurseid ON "PatientAdmitVisitVitals"("NurseId");
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_patientid ON "PatientAdmitVisitVitals"("PatientId");
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_patientstatus ON "PatientAdmitVisitVitals"("PatientStatus");
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_dailyorhourlyvitals ON "PatientAdmitVisitVitals"("DailyOrHourlyVitals");
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_recordeddatetime ON "PatientAdmitVisitVitals"("RecordedDateTime");
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_vitalsstatus ON "PatientAdmitVisitVitals"("VitalsStatus");
CREATE INDEX IF NOT EXISTS idx_patientadmitvisitvitals_status ON "PatientAdmitVisitVitals"("Status");

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "AuditLogId" SERIAL PRIMARY KEY,
    "ActionLogName" VARCHAR(255) NOT NULL,
    "ActionBy" INTEGER,
    "ActionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ActionBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Create indexes for AuditLog
CREATE INDEX IF NOT EXISTS idx_auditlog_actionby ON "AuditLog"("ActionBy");
CREATE INDEX IF NOT EXISTS idx_auditlog_actiondate ON "AuditLog"("ActionDate");

