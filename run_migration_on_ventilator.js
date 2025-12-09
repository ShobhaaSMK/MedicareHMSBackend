require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    process.stdout.write('Starting migration: Add OnVentilator column to PatientICUAdmission table...\n');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_on_ventilator_to_patient_icu_admission.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.query(migrationSQL);
    
    process.stdout.write('✓ Migration completed successfully!\n');
    process.stdout.write('✓ OnVentilator column has been added to PatientICUAdmission table\n');
    
    // Verify the column was added
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND column_name = 'OnVentilator';
    `;
    
    const verifyResult = await db.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      process.stdout.write('\n✓ Verification: Column exists in database\n');
      process.stdout.write('  Column details: ' + JSON.stringify(verifyResult.rows[0]) + '\n');
    } else {
      process.stdout.write('\n⚠ Warning: Column not found after migration\n');
    }
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    process.stderr.write('✗ Migration failed: ' + error.message + '\n');
    process.stderr.write('Error details: ' + JSON.stringify(error) + '\n');
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
