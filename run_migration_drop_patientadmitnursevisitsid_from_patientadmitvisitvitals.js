require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Drop PatientAdmitNurseVisitsId column from PatientAdmitVisitVitals...\n');

  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'drop_patientadmitnursevisitsid_from_patientadmitvisitvitals.sql');

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

    // Verify the column was dropped
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientAdmitVisitVitals'
      AND column_name = 'PatientAdmitNurseVisitsId';
    `;

    const { rows } = await db.query(checkQuery);

    if (rows.length === 0) {
      console.log('✓ Verification: PatientAdmitNurseVisitsId column has been dropped');
    } else {
      console.log('⚠ Warning: PatientAdmitNurseVisitsId column still exists');
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();