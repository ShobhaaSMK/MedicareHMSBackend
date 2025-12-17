require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = await db.pool.connect();
  try {
    console.log('Starting migration: Add AttendingDoctorId to PatientICUAdmission table...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'add_attending_doctor_id_to_patient_icu_admission.sql'),
      'utf8'
    );
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✓ Migration completed successfully');
    console.log('  - Added AttendingDoctorId column to PatientICUAdmission table');
    console.log('  - Added foreign key constraint to Users table');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error.message);
    if (error.detail) {
      console.error('  Detail:', error.detail);
    }
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

