-- Create Bills table
CREATE TABLE IF NOT EXISTS "Bills" (
    "BillId" SERIAL PRIMARY KEY,
    "BillNo" VARCHAR(50) NOT NULL UNIQUE,
    "BillDateTime" TIMESTAMP NOT NULL,
    "Amount" DECIMAL(10, 2) NOT NULL,
    "PaidStatus" VARCHAR(50) DEFAULT 'Unpaid' CHECK ("PaidStatus" IN ('Paid', 'Unpaid', 'Partial')),
    "PatientId" UUID,
    "PatientType" VARCHAR(50),
    "AppointmentId" INTEGER,
    "RoomAdmissionId" INTEGER,
    "EmergencyAdmissionId" INTEGER,
    "BillType" VARCHAR(50) DEFAULT 'Consultation',
    "Remarks" TEXT,
    "CreatedBy" INTEGER,
    "CreatedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "Status" VARCHAR(50) DEFAULT 'Active',
    FOREIGN KEY ("PatientId") REFERENCES "PatientRegistration"("PatientId") ON DELETE SET NULL,
    FOREIGN KEY ("AppointmentId") REFERENCES "PatientAppointment"("PatientAppointmentId") ON DELETE SET NULL,
    FOREIGN KEY ("RoomAdmissionId") REFERENCES "RoomAdmission"("RoomAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("EmergencyAdmissionId") REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") ON DELETE SET NULL,
    FOREIGN KEY ("CreatedBy") REFERENCES "Users"("UserId") ON DELETE SET NULL
);

-- Create indexes for Bills table
CREATE INDEX IF NOT EXISTS idx_bills_billno ON "Bills"("BillNo");
CREATE INDEX IF NOT EXISTS idx_bills_patientid ON "Bills"("PatientId");
CREATE INDEX IF NOT EXISTS idx_bills_billdatetime ON "Bills"("BillDateTime");
CREATE INDEX IF NOT EXISTS idx_bills_paidstatus ON "Bills"("PaidStatus");
CREATE INDEX IF NOT EXISTS idx_bills_status ON "Bills"("Status");
