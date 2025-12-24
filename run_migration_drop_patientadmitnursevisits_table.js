require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Drop PatientAdmitNurseVisits table...\n');

  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'drop_patientadmitnursevisits_table.sql');

    if (!fs.existsSync(sqlFilePath)) {
      console.error(`✗ Migration file not found: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      console.error('✗ Migration file is empty');
      process.exit(1);
    }

    // Execute the migration
    console.log('Executing migration SQL...');
    await db.query(sql);
    console.log('✓ Migration executed successfully\n');

    // Verify the table was dropped
    const checkQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'PatientAdmitNurseVisits';
    `;

    const { rows } = await db.query(checkQuery);

    if (rows.length === 0) {
      console.log('✓ Verification: PatientAdmitNurseVisits table has been dropped');
    } else {
      console.log('⚠ Warning: PatientAdmitNurseVisits table still exists');
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();