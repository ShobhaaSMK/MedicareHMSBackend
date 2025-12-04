require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigration() {
  try {
    console.log('Running migration: Add ICUSlotStatus to PatientICUAdmission...');
    
    const sqlFile = path.join(__dirname, 'add_icuslotstatus_to_patient_icu_admission.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL migration
    await db.query(sql);
    
    console.log('✓ Migration completed successfully: ICUSlotStatus added to PatientICUAdmission');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = runMigration;

