const { Pool } = require('pg');
const { randomUUID } = require('crypto');
require('dotenv').config();

/**
 * Script to insert dummy records into PatientICUAdmission table
 * This script will:
 * 1. Check for existing patients, ICUs, and users
 * 2. Create realistic dummy ICU admission records
 */

async function insertDummyICUAdmissions() {
  // Database configuration
  const dbHost = process.env.PGHOST || process.env.DB_HOST || 'localhost';
  const dbPort = process.env.PGPORT || process.env.DB_PORT || 5432;
  const dbUser = process.env.PGUSER || process.env.DB_USER || 'postgres';
  const dbPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';
  const dbName = process.env.PGDATABASE || process.env.DB_NAME || 'hms';

  const config = {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  };

  const pool = new Pool(config);

  try {
    console.log('🔍 Checking existing data...\n');

    // Get existing patients
    const patientsResult = await pool.query('SELECT "PatientId" FROM "PatientRegistration" LIMIT 10');
    const patientIds = patientsResult.rows.map(r => r.PatientId);
    
    if (patientIds.length === 0) {
      console.error('❌ No patients found in PatientRegistration table. Please add patients first.');
      await pool.end();
      process.exit(1);
    }
    console.log(`✓ Found ${patientIds.length} patient(s)`);

    // Get existing ICUs
    const icusResult = await pool.query('SELECT "ICUId" FROM "ICU" WHERE "Status" = \'Active\' LIMIT 10');
    const icuIds = icusResult.rows.map(r => r.ICUId);
    
    if (icuIds.length === 0) {
      console.error('❌ No active ICUs found. Please add ICUs first.');
      await pool.end();
      process.exit(1);
    }
    console.log(`✓ Found ${icuIds.length} ICU(s)`);

    // Get existing users (for ICUAllocationCreatedBy)
    const usersResult = await pool.query('SELECT "UserId" FROM "Users" WHERE "Status" = \'Active\' LIMIT 5');
    const userIds = usersResult.rows.map(r => r.UserId);
    
    if (userIds.length === 0) {
      console.warn('⚠ No active users found. Will use NULL for ICUAllocationCreatedBy');
    } else {
      console.log(`✓ Found ${userIds.length} user(s)`);
    }

    // Get existing appointments (optional)
    const appointmentsResult = await pool.query('SELECT "PatientAppointmentId" FROM "PatientAppointment" LIMIT 5');
    const appointmentIds = appointmentsResult.rows.map(r => r.PatientAppointmentId);
    console.log(`✓ Found ${appointmentIds.length} appointment(s) (optional)`);

    console.log('\n📝 Creating dummy ICU admission records...\n');

    // Sample diagnoses and conditions
    const diagnoses = [
      'Acute Myocardial Infarction',
      'Severe Pneumonia',
      'Post-operative Care',
      'Acute Respiratory Distress Syndrome (ARDS)',
      'Sepsis',
      'Stroke',
      'Traumatic Brain Injury',
      'Multiple Organ Failure',
      'Severe COVID-19',
      'Cardiac Arrest Recovery'
    ];

    const patientConditions = [
      'Critical - Requires constant monitoring',
      'Stable but needs intensive care',
      'Post-surgery recovery',
      'Improving condition',
      'Serious - On ventilator support',
      'Stable - Responding to treatment',
      'Critical - Multiple organ support',
      'Gradually improving',
      'Serious - Respiratory support needed',
      'Stable - Monitoring vital signs'
    ];

    const treatmentDetails = [
      'Continuous monitoring, IV antibiotics, oxygen support',
      'Ventilator support, medication management, regular vitals check',
      'Post-operative monitoring, pain management, wound care',
      'Respiratory support, medication, physiotherapy',
      'Antibiotic therapy, fluid management, vital signs monitoring',
      'Neurological monitoring, medication, rehabilitation',
      'Multi-organ support, dialysis, medication',
      'Medication adjustment, monitoring, gradual recovery',
      'Oxygen therapy, antiviral medication, supportive care',
      'Cardiac monitoring, medication, rehabilitation'
    ];

    const icuPatientStatuses = ['Serious', 'Critical', 'Stable'];
    const icuAdmissionStatuses = ['Occupied', 'Discharged'];
    const onVentilatorOptions = ['Yes', 'No'];

    // Generate dummy records
    const dummyRecords = [];
    const numRecords = Math.min(10, patientIds.length, icuIds.length); // Create up to 10 records

    for (let i = 0; i < numRecords; i++) {
      const patientId = patientIds[i % patientIds.length];
      const icuId = icuIds[i % icuIds.length];
      const userId = userIds.length > 0 ? userIds[i % userIds.length] : null;
      const appointmentId = appointmentIds.length > 0 && Math.random() > 0.5 
        ? appointmentIds[Math.floor(Math.random() * appointmentIds.length)] 
        : null;

      // Generate dates
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
      
      const toDate = Math.random() > 0.3 ? null : (() => {
        const date = new Date(fromDate);
        date.setDate(date.getDate() + Math.floor(Math.random() * 15) + 1); // 1-15 days later
        return date;
      })();

      const numberOfDays = toDate 
        ? Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24))
        : Math.ceil((new Date() - fromDate) / (1000 * 60 * 60 * 24));

      const isDischarged = toDate !== null;
      const icuAdmissionStatus = isDischarged ? 'Discharged' : 'Occupied';
      const onVentilator = Math.random() > 0.6 ? 'Yes' : 'No';
      const icuPatientStatus = icuPatientStatuses[Math.floor(Math.random() * icuPatientStatuses.length)];

      const record = {
        PatientICUAdmissionId: randomUUID(),
        PatientId: patientId,
        PatientAppointmentId: appointmentId,
        EmergencyBedSlotId: null,
        ICUId: icuId,
        ICUPatientStatus: icuPatientStatus,
        ICUAdmissionStatus: icuAdmissionStatus,
        ICUAllocationFromDate: fromDate.toISOString().split('T')[0], // YYYY-MM-DD format
        ICUAllocationToDate: toDate ? toDate.toISOString().split('T')[0] : null,
        NumberOfDays: numberOfDays,
        Diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        TreatementDetails: treatmentDetails[Math.floor(Math.random() * treatmentDetails.length)],
        PatientCondition: patientConditions[Math.floor(Math.random() * patientConditions.length)],
        ICUAllocationCreatedBy: userId,
        Status: 'Active',
        OnVentilator: onVentilator
      };

      dummyRecords.push(record);
    }

    // Insert records
    let insertedCount = 0;
    let errorCount = 0;

    for (const record of dummyRecords) {
      try {
        const query = `
          INSERT INTO "PatientICUAdmission" (
            "PatientICUAdmissionId",
            "PatientId",
            "PatientAppointmentId",
            "EmergencyBedSlotId",
            "ICUId",
            "ICUPatientStatus",
            "ICUAdmissionStatus",
            "ICUAllocationFromDate",
            "ICUAllocationToDate",
            "NumberOfDays",
            "Diagnosis",
            "TreatementDetails",
            "PatientCondition",
            "ICUAllocationCreatedBy",
            "Status",
            "OnVentilator"
          ) VALUES (
            $1::uuid,
            $2::uuid,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8::date,
            $9::date,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16
          )
        `;

        await pool.query(query, [
          record.PatientICUAdmissionId,
          record.PatientId,
          record.PatientAppointmentId,
          record.EmergencyBedSlotId,
          record.ICUId,
          record.ICUPatientStatus,
          record.ICUAdmissionStatus,
          record.ICUAllocationFromDate,
          record.ICUAllocationToDate,
          record.NumberOfDays,
          record.Diagnosis,
          record.TreatementDetails,
          record.PatientCondition,
          record.ICUAllocationCreatedBy,
          record.Status,
          record.OnVentilator
        ]);

        insertedCount++;
        console.log(`✓ Inserted record ${insertedCount}: ${record.Diagnosis.substring(0, 30)}... (Status: ${record.ICUAdmissionStatus})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error inserting record: ${error.message}`);
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          console.error(`  → Skipping duplicate record`);
        } else {
          console.error(`  → Record details: PatientId=${record.PatientId}, ICUId=${record.ICUId}`);
        }
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   - Successfully inserted: ${insertedCount} record(s)`);
    if (errorCount > 0) {
      console.log(`   - Errors: ${errorCount} record(s)`);
    }

    // Verify inserted records
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM "PatientICUAdmission" 
      WHERE "Status" = 'Active'
    `);
    console.log(`   - Total active ICU admissions in database: ${verifyResult.rows[0].count}`);

    await pool.end();
    console.log('\n✨ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  insertDummyICUAdmissions();
}

module.exports = { insertDummyICUAdmissions };









