require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Update DailyOrHourlyVitals constraints...\n');

  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'update_dailyorhourlyvitals_constraints.sql');

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

    // Verify the constraints were updated
    const checkQuery = `
      SELECT conname, pg_get_constraintdef(oid) as constraint_def
      FROM pg_constraint
      WHERE conname LIKE '%DailyOrHourlyVitals%'
      ORDER BY conname;
    `;

    const { rows } = await db.query(checkQuery);

    console.log('Updated constraints:');
    rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.constraint_def}`);
    });

    // Check if the constraints now allow 'Daily Vitals' and 'Hourly Vitals'
    const hasCorrectConstraints = rows.every(row =>
      row.constraint_def.includes("'Daily Vitals'") && row.constraint_def.includes("'Hourly Vitals'")
    );

    if (hasCorrectConstraints) {
      console.log('✓ Verification: All constraints updated to use "Daily Vitals" and "Hourly Vitals"');
    } else {
      console.log('⚠ Warning: Some constraints may not have been updated correctly');
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration();