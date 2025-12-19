/**
 * Script to insert sample patient records into PatientRegistration table
 * Run with: node insert_sample_patients.js
 */

const db = require('./db');

async function insertSamplePatients() {
  try {
    console.log('Starting to insert sample patient records...\n');

    // Sample patient data
    const samplePatients = [
      {
        PatientNo: 'P2025_01_0001',
        PatientName: 'Rajesh',
        LastName: 'Kumar',
        PhoneNo: '9876543210',
        Gender: 'Male',
        Age: 35,
        Address: '123 Main Street, Bangalore, Karnataka - 560001',
        AdhaarID: '123456789012',
        PANCard: 'ABCDE1234F',
        PatientType: 'OPD',
        ChiefComplaint: 'Fever and cough for 3 days',
        Description: 'Patient presents with high fever and persistent cough. No history of chronic diseases.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0002',
        PatientName: 'Priya',
        LastName: 'Sharma',
        PhoneNo: '9876543211',
        Gender: 'Female',
        Age: 28,
        Address: '456 Park Avenue, Mumbai, Maharashtra - 400001',
        AdhaarID: '234567890123',
        PatientType: 'OPD',
        ChiefComplaint: 'Abdominal pain',
        Description: 'Patient complains of lower abdominal pain for 2 days. Pain is intermittent.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0003',
        PatientName: 'Amit',
        LastName: 'Patel',
        PhoneNo: '9876543212',
        Gender: 'Male',
        Age: 65,
        Address: '789 Gandhi Road, Ahmedabad, Gujarat - 380001',
        AdhaarID: '345678901234',
        PANCard: 'FGHIJ5678K',
        PatientType: 'IPD',
        ChiefComplaint: 'Chest pain and shortness of breath',
        Description: 'Elderly patient with history of hypertension. Presenting with chest discomfort and breathing difficulty.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0004',
        PatientName: 'Sneha',
        LastName: 'Reddy',
        PhoneNo: '9876543213',
        Gender: 'Female',
        Age: 22,
        Address: '321 MG Road, Hyderabad, Telangana - 500001',
        PatientType: 'Emergency',
        ChiefComplaint: 'Accident - Head injury',
        Description: 'Patient involved in road traffic accident. Sustained head injury. Brought to emergency.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0005',
        PatientName: 'Vikram',
        LastName: 'Singh',
        PhoneNo: '9876543214',
        Gender: 'Male',
        Age: 45,
        Address: '654 Nehru Street, Delhi, Delhi - 110001',
        AdhaarID: '456789012345',
        PatientType: 'Direct',
        ChiefComplaint: 'Routine health checkup',
        Description: 'Patient coming for annual health checkup. No specific complaints.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0006',
        PatientName: 'Anjali',
        LastName: 'Desai',
        PhoneNo: '9876543215',
        Gender: 'Female',
        Age: 32,
        Address: '987 Commercial Street, Pune, Maharashtra - 411001',
        AdhaarID: '567890123456',
        PatientType: 'OPD',
        ChiefComplaint: 'Back pain',
        Description: 'Patient complains of lower back pain for 1 week. Pain worsens with movement.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0007',
        PatientName: 'Rahul',
        LastName: 'Verma',
        PhoneNo: '9876543216',
        Gender: 'Male',
        Age: 26,
        Address: '147 Sector 15, Noida, Uttar Pradesh - 201301',
        PatientType: 'Emergency',
        ChiefComplaint: 'Severe headache and vomiting',
        Description: 'Patient presents with sudden onset severe headache and multiple episodes of vomiting.',
        Status: 'Active'
      },
      {
        PatientNo: 'P2025_01_0008',
        PatientName: 'Kamala',
        LastName: 'Iyer',
        PhoneNo: '9876543217',
        Gender: 'Female',
        Age: 70,
        Address: '258 Temple Street, Chennai, Tamil Nadu - 600001',
        AdhaarID: '678901234567',
        PANCard: 'LMNOP9012Q',
        PatientType: 'IPD',
        ChiefComplaint: 'Diabetes management',
        Description: 'Patient with type 2 diabetes. Coming for regular follow-up and medication adjustment.',
        Status: 'Active'
      }
    ];

    const insertQuery = `
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT ("PatientNo") DO NOTHING
      RETURNING "PatientNo", "PatientName";
    `;

    let insertedCount = 0;
    let skippedCount = 0;

    for (const patient of samplePatients) {
      try {
        const result = await db.query(insertQuery, [
          patient.PatientNo,
          patient.PatientName,
          patient.LastName || null,
          patient.PhoneNo,
          patient.Gender || null,
          patient.Age || null,
          patient.Address || null,
          patient.AdhaarID || null,
          patient.PANCard || null,
          patient.PatientType || null,
          patient.ChiefComplaint || null,
          patient.Description || null,
          patient.Status || 'Active'
        ]);

        if (result.rows.length > 0) {
          insertedCount++;
          console.log(`✓ Inserted: ${result.rows[0].PatientNo || result.rows[0].patientno} - ${result.rows[0].PatientName || result.rows[0].patientname}`);
        } else {
          skippedCount++;
          console.log(`⚠ Skipped (duplicate): ${patient.PatientNo} - ${patient.PatientName}`);
        }
      } catch (error) {
        if (error.code === '23505') {
          // Unique constraint violation - record already exists
          skippedCount++;
          console.log(`⚠ Skipped (duplicate): ${patient.PatientNo} - ${patient.PatientName}`);
        } else {
          console.error(`✗ Error inserting ${patient.PatientNo}:`, error.message);
          console.error(`   Details:`, error.detail || 'No additional details');
        }
      }
    }

    // Verify inserted records
    console.log('\n--- Verifying inserted records ---\n');
    const verifyQuery = `
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
      ORDER BY "PatientNo"
    `;

    const { rows } = await db.query(verifyQuery);

    console.log(`Total records found: ${rows.length}\n`);
    console.log('Patient Records:');
    console.log('─'.repeat(100));
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.PatientNo || row.patientno} - ${row.PatientName || row.patientname} ${row.LastName || row.lastname || ''}`);
      console.log(`   Phone: ${row.PhoneNo || row.phoneno} | Gender: ${row.Gender || row.gender || 'N/A'} | Age: ${row.Age || row.age || 'N/A'}`);
      console.log(`   Type: ${row.PatientType || row.patienttype || 'N/A'} | Status: ${row.Status || row.status || 'N/A'}`);
      console.log(`   Registered: ${row.RegisteredDate || row.registereddate || 'N/A'}`);
      console.log('');
    });

    console.log('─'.repeat(100));
    console.log(`\n✓ Successfully processed: ${insertedCount} inserted, ${skippedCount} skipped`);
    console.log(`✓ Total records in database: ${rows.length}\n`);

  } catch (error) {
    console.error('Error inserting sample patients:', error);
    throw error;
  } finally {
    // Close the database connection
    if (db.pool) {
      await db.pool.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the script
if (require.main === module) {
  insertSamplePatients()
    .then(() => {
      console.log('Script completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { insertSamplePatients };

