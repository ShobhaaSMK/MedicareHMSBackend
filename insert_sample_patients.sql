-- Insert Sample Patient Registration Records
-- This script inserts a few sample patient records into the PatientRegistration table

-- Sample Patient 1: Male, Adult
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PANCard",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0001',
    'Rajesh',
    'Kumar',
    '9876543210',
    'Male',
    35,
    '123 Main Street, Bangalore, Karnataka - 560001',
    '123456789012',
    'ABCDE1234F',
    'OPD',
    'Fever and cough for 3 days',
    'Patient presents with high fever and persistent cough. No history of chronic diseases.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 2: Female, Adult
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0002',
    'Priya',
    'Sharma',
    '9876543211',
    'Female',
    28,
    '456 Park Avenue, Mumbai, Maharashtra - 400001',
    '234567890123',
    'OPD',
    'Abdominal pain',
    'Patient complains of lower abdominal pain for 2 days. Pain is intermittent.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 3: Male, Senior
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PANCard",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0003',
    'Amit',
    'Patel',
    '9876543212',
    'Male',
    65,
    '789 Gandhi Road, Ahmedabad, Gujarat - 380001',
    '345678901234',
    'FGHIJ5678K',
    'IPD',
    'Chest pain and shortness of breath',
    'Elderly patient with history of hypertension. Presenting with chest discomfort and breathing difficulty.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 4: Female, Young Adult
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0004',
    'Sneha',
    'Reddy',
    '9876543213',
    'Female',
    22,
    '321 MG Road, Hyderabad, Telangana - 500001',
    'Emergency',
    'Accident - Head injury',
    'Patient involved in road traffic accident. Sustained head injury. Brought to emergency.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 5: Male, Middle-aged
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0005',
    'Vikram',
    'Singh',
    '9876543214',
    'Male',
    45,
    '654 Nehru Street, Delhi, Delhi - 110001',
    '456789012345',
    'Direct',
    'Routine health checkup',
    'Patient coming for annual health checkup. No specific complaints.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 6: Female, Adult
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0006',
    'Anjali',
    'Desai',
    '9876543215',
    'Female',
    32,
    '987 Commercial Street, Pune, Maharashtra - 411001',
    '567890123456',
    'OPD',
    'Back pain',
    'Patient complains of lower back pain for 1 week. Pain worsens with movement.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 7: Male, Young Adult
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0007',
    'Rahul',
    'Verma',
    '9876543216',
    'Male',
    26,
    '147 Sector 15, Noida, Uttar Pradesh - 201301',
    'Emergency',
    'Severe headache and vomiting',
    'Patient presents with sudden onset severe headache and multiple episodes of vomiting.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Sample Patient 8: Female, Senior
INSERT INTO "PatientRegistration" (
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "Address",
    "AdhaarID",
    "PANCard",
    "PatientType",
    "ChiefComplaint",
    "Description",
    "Status"
) VALUES (
    'P2025_01_0008',
    'Kamala',
    'Iyer',
    '9876543217',
    'Female',
    70,
    '258 Temple Street, Chennai, Tamil Nadu - 600001',
    '678901234567',
    'LMNOP9012Q',
    'IPD',
    'Diabetes management',
    'Patient with type 2 diabetes. Coming for regular follow-up and medication adjustment.',
    'Active'
) ON CONFLICT ("PatientNo") DO NOTHING;

-- Verify the inserted records
SELECT 
    "PatientNo",
    "PatientName",
    "LastName",
    "PhoneNo",
    "Gender",
    "Age",
    "PatientType",
    "Status",
    "RegisteredDate"
FROM "PatientRegistration"
WHERE "PatientNo" LIKE 'P2025_01_%'
ORDER BY "PatientNo";

