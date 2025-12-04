require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runMigration() {
  try {
    console.log('Running migration: Rename ICUSlotStatus to ICUAdmissionStatus...');
    
    const sqlFile = path.join(__dirname, 'rename_icuslotstatus_to_icuadmissionstatus.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Execute the SQL migration
    await db.query(sql);
    
    console.log('✓ Migration completed successfully: ICUSlotStatus renamed to ICUAdmissionStatus');
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

