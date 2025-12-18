const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migration: Add PatientType to RoomAdmission table...');
    
    const sqlFile = path.join(__dirname, 'add_patienttype_to_roomadmission.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await db.query(sql);
    
    console.log('Migration completed successfully: PatientType column added to RoomAdmission table');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

