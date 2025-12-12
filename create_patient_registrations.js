require('dotenv').config();
const db = require('./db');
const { initializeTables } = require('./dbInit');

/**
 * Generate PatientNo in format PYYYY_MM_XXXX
 * Example: P2025_11_0001
 */
async function generatePatientNo() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}_${month}`;
  const pattern = `P${yearMonth}_%`;

  // Find the highest sequence number for this year_month
  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING("PatientNo" FROM 10) AS INT)), 0) + 1 AS next_seq
    FROM "PatientRegistration"
    WHERE "PatientNo" LIKE $1
  `;

  const { rows } = await db.query(query, [pattern]);
  const nextSeq = rows[0].next_seq;

  // Format as PYYYY_MM_XXXX (P prefix, 4 digits with leading zeros)
  const patientNo = `P${yearMonth}_${String(nextSeq).padStart(4, '0')}`;
  return patientNo;
}

// Function to get available users for RegisteredBy
async function getAvailableUsers() {
  try {
    // First check if Users table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠ Users table does not exist. Tables may need to be initialized.');
      return [];
    }
    
    const query = `
      SELECT "UserId", "UserName"
      FROM "Users"
      WHERE "Status" = 'Active'
      ORDER BY "UserId"
      LIMIT 10
    `;
    
    const { rows } = await db.query(query);
    return rows;
  } catch (error) {
    console.error('Error fetching users:', error.message);
    // Return empty array instead of throwing - we'll handle it in main()
    return [];
  }
}

// Function to generate a valid 12-digit AdhaarID
function generateAdhaarID() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

// Function to generate a valid PAN Card
function generatePANCard() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let pan = '';
  // First 5 letters
  for (let i = 0; i < 5; i++) {
    pan += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // Next 4 digits
  for (let i = 0; i < 4; i++) {
    pan += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  // Last letter
  pan += letters.charAt(Math.floor(Math.random() * letters.length));
  
  return pan;
}

// Sample patient data
const samplePatients = [
  {
    PatientName: 'Rajesh',
    LastName: 'Kumar',
    PhoneNo: '9876543210',
    Gender: 'Male',
    Age: 35,
    Address: '123 Main Street, Mumbai, Maharashtra 400001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'OPD',
    ChiefComplaint: 'Fever and cough for 3 days',
    Description: 'Patient experiencing high fever (102°F) and persistent dry cough. No history of travel or contact with COVID patients.',
    Status: 'Active'
  },
  {
    PatientName: 'Priya',
    LastName: 'Sharma',
    PhoneNo: '9876543211',
    Gender: 'Female',
    Age: 28,
    Address: '456 Park Avenue, Delhi, Delhi 110001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'IPD',
    ChiefComplaint: 'Severe abdominal pain',
    Description: 'Patient complaining of severe lower abdominal pain for 2 days. Pain is sharp and intermittent. No vomiting or diarrhea.',
    Status: 'Active'
  },
  {
    PatientName: 'Amit',
    LastName: 'Patel',
    PhoneNo: '9876543212',
    Gender: 'Male',
    Age: 45,
    Address: '789 MG Road, Bangalore, Karnataka 560001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'Emergency',
    ChiefComplaint: 'Chest pain and shortness of breath',
    Description: 'Patient arrived with acute chest pain radiating to left arm. Experiencing shortness of breath. History of hypertension.',
    Status: 'Active'
  },
  {
    PatientName: 'Sunita',
    LastName: 'Singh',
    PhoneNo: '9876543213',
    Gender: 'Female',
    Age: 52,
    Address: '321 Gandhi Nagar, Ahmedabad, Gujarat 380001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'Direct',
    ChiefComplaint: 'Routine health checkup',
    Description: 'Patient visiting for annual health checkup. No specific complaints. Wants comprehensive health screening.',
    Status: 'Active'
  },
  {
    PatientName: 'Vikram',
    LastName: 'Reddy',
    PhoneNo: '9876543214',
    Gender: 'Male',
    Age: 38,
    Address: '654 Nehru Street, Hyderabad, Telangana 500001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'OPD',
    ChiefComplaint: 'Headache and dizziness',
    Description: 'Patient experiencing frequent headaches for past week. Also complains of dizziness, especially in the morning. BP: 140/90.',
    Status: 'Active'
  },
  {
    PatientName: 'Anjali',
    LastName: 'Desai',
    PhoneNo: '9876543215',
    Gender: 'Female',
    Age: 29,
    Address: '987 Marine Drive, Mumbai, Maharashtra 400020',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'IPD',
    ChiefComplaint: 'Fractured wrist',
    Description: 'Patient fell and injured right wrist. X-ray shows fracture of distal radius. Requires surgical intervention.',
    Status: 'Active'
  },
  {
    PatientName: 'Rahul',
    LastName: 'Verma',
    PhoneNo: '9876543216',
    Gender: 'Male',
    Age: 41,
    Address: '147 Sector 18, Noida, Uttar Pradesh 201301',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'Emergency',
    ChiefComplaint: 'Severe allergic reaction',
    Description: 'Patient developed severe allergic reaction after consuming seafood. Experiencing hives, swelling, and difficulty breathing.',
    Status: 'Active'
  },
  {
    PatientName: 'Meera',
    LastName: 'Nair',
    PhoneNo: '9876543217',
    Gender: 'Female',
    Age: 33,
    Address: '258 MG Road, Kochi, Kerala 682001',
    AdhaarID: generateAdhaarID(),
    PANCard: generatePANCard(),
    PatientType: 'OPD',
    ChiefComplaint: 'Persistent back pain',
    Description: 'Patient has been experiencing lower back pain for past 2 months. Pain worsens with prolonged sitting. No history of injury.',
    Status: 'Active'
  }
];

async function main() {
  console.log('Creating Patient Registration Records...\n');
  
  // First, check if PatientRegistration table exists and create if needed
  console.log('Checking if PatientRegistration table exists...');
  try {
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientRegistration'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠ PatientRegistration table does not exist.');
      console.log('⚠ Creating PatientRegistration table...\n');
      
      // Create PatientRegistration table directly
      const createTableQuery = `
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
        
        CREATE INDEX IF NOT EXISTS idx_patient_registeredby ON "PatientRegistration"("RegisteredBy");
        CREATE INDEX IF NOT EXISTS idx_patient_patientno ON "PatientRegistration"("PatientNo");
        CREATE INDEX IF NOT EXISTS idx_patient_status ON "PatientRegistration"("Status");
      `;
      
      await db.query(createTableQuery);
      console.log('✓ PatientRegistration table created successfully.\n');
    } else {
      console.log('✓ PatientRegistration table exists.\n');
    }
  } catch (error) {
    console.error('Error checking/creating PatientRegistration table:', error.message);
    console.error('Please ensure the database is properly configured.');
    await db.pool.end();
    process.exit(1);
  }
  
  // Get available users for RegisteredBy
  const users = await getAvailableUsers();
  
  let defaultRegisteredBy = null;
  
  if (users.length === 0) {
    console.log('⚠ No active users found in the database.');
    console.log('⚠ Attempting to use UserId = 1 as default (if exists)...\n');
    
    // Try to use UserId = 1 as a fallback
    try {
      const checkUser = await db.query('SELECT "UserId" FROM "Users" WHERE "UserId" = 1');
      if (checkUser.rows.length > 0) {
        defaultRegisteredBy = 1;
        console.log('✓ Using UserId = 1 as RegisteredBy\n');
      } else {
        console.log('⚠ UserId = 1 does not exist. Will attempt to create patients with RegisteredBy = NULL.\n');
        console.log('⚠ Note: This may fail if RegisteredBy is required by application logic.\n');
      }
    } catch (error) {
      console.log('⚠ Could not check for UserId = 1. Will attempt to create patients with RegisteredBy = NULL.\n');
    }
  } else {
    console.log('Available Users for RegisteredBy:');
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. UserId: ${u.UserId}, Name: ${u.UserName}`);
    });
    console.log('');
    
    // Use the first available user as RegisteredBy
    defaultRegisteredBy = users[0].UserId;
    console.log(`Using UserId ${defaultRegisteredBy} (${users[0].UserName}) as RegisteredBy\n`);
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < samplePatients.length; i++) {
    const patient = samplePatients[i];
    
    try {
      // Generate unique PatientNo
      const patientNo = await generatePatientNo();
      
      // Check if PatientNo already exists (shouldn't happen, but just in case)
      const existingPatient = await db.query(
        'SELECT "PatientId" FROM "PatientRegistration" WHERE "PatientNo" = $1',
        [patientNo]
      );
      
      if (existingPatient.rows.length > 0) {
        console.log(`⚠ Skipping - PatientNo ${patientNo} already exists`);
        continue;
      }
      
      // Check if AdhaarID already exists
      if (patient.AdhaarID) {
        const existingAdhaar = await db.query(
          'SELECT "PatientId" FROM "PatientRegistration" WHERE "AdhaarID" = $1',
          [patient.AdhaarID]
        );
        
        if (existingAdhaar.rows.length > 0) {
          // Generate a new AdhaarID
          patient.AdhaarID = generateAdhaarID();
          console.log(`⚠ AdhaarID conflict, generated new one: ${patient.AdhaarID}`);
        }
      }
      
      // Insert patient record
      const insertQuery = `
        INSERT INTO "PatientRegistration"
          ("PatientNo", "PatientName", "LastName", "PhoneNo", "Gender", "Age", "Address",
           "AdhaarID", "PANCard", "PatientType",
           "ChiefComplaint", "Description",
           "Status", "RegisteredBy")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;
      `;
      
      const { rows } = await db.query(insertQuery, [
        patientNo,
        patient.PatientName.trim(),
        patient.LastName ? patient.LastName.trim() : null,
        patient.PhoneNo.trim(),
        patient.Gender || null,
        patient.Age || null,
        patient.Address || null,
        patient.AdhaarID && patient.AdhaarID.trim() !== '' ? patient.AdhaarID.trim() : null,
        patient.PANCard ? patient.PANCard.trim().toUpperCase() : null,
        patient.PatientType || null,
        patient.ChiefComplaint || null,
        patient.Description || null,
        patient.Status || 'Active',
        defaultRegisteredBy
      ]);
      
      const created = rows[0];
      
      console.log(`✓ Created Patient ${i + 1}/${samplePatients.length}`);
      console.log(`  PatientId: ${created.PatientId}`);
      console.log(`  PatientNo: ${created.PatientNo}`);
      console.log(`  Name: ${created.PatientName} ${created.LastName || ''}`);
      console.log(`  PhoneNo: ${created.PhoneNo}`);
      console.log(`  Gender: ${created.Gender}, Age: ${created.Age}`);
      console.log(`  PatientType: ${created.PatientType}`);
      console.log(`  Status: ${created.Status}`);
      console.log('');
      
      results.push(created);
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.message && error.message.includes('AdhaarID')) {
          console.log(`⚠ AdhaarID conflict for patient ${i + 1}, generating new one...`);
          patient.AdhaarID = generateAdhaarID();
          i--; // Retry this patient
          continue;
        } else {
          console.error(`✗ Error creating patient ${i + 1}: ${error.message}`);
          errors.push({ patient: patient.PatientName, error: error.message });
        }
      } else {
        console.error(`✗ Error creating patient ${i + 1}: ${error.message}`);
        errors.push({ patient: patient.PatientName, error: error.message });
      }
    }
  }
  
  console.log('=== Summary ===');
  console.log(`Total attempted: ${samplePatients.length}`);
  console.log(`Successfully created: ${results.length} patient(s)`);
  console.log(`Failed: ${errors.length}`);
  
  if (results.length > 0) {
    console.log('\nCreated Patients:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. PatientNo: ${result.PatientNo}, Name: ${result.PatientName} ${result.LastName || ''}, Type: ${result.PatientType}`);
    });
  }
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.patient}: ${err.error}`);
    });
  }
  
  await db.pool.end();
}

main()
  .then(() => {
    console.log('\nScript completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

