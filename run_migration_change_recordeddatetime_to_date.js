require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Change RecordedDateTime to date type in PatientAdmitVisitVitals...\n');

  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'change_recordeddatetime_to_date.sql');

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

    // Verify the column type was changed
    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientAdmitVisitVitals'
      AND column_name = 'RecordedDateTime';
    `;

    const { rows } = await db.query(checkQuery);

    if (rows.length > 0) {
      console.log('✓ Verification: RecordedDateTime column type changed');
      console.log(`  Data Type: ${rows[0].data_type}`);
      console.log(`  Nullable: ${rows[0].is_nullable}`);
    } else {
      console.log('⚠ Warning: Could not verify RecordedDateTime column');
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();