require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    console.log('========================================');
    console.log('Running Migration: Add OnVentilator Column');
    console.log('========================================\n');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_on_ventilator_to_patient_icu_admission.sql');
    console.log('Reading migration file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\nExecuting migration SQL...');
    await db.query(migrationSQL);
    console.log('✓ Migration SQL executed successfully');
    
    // Verify
    console.log('\nVerifying column exists...');
    const verifyQuery = `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND column_name = 'OnVentilator';
    `;
    
    const verifyResult = await db.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ SUCCESS: OnVentilator column exists in PatientICUAdmission table');
      console.log('\nColumn Details:');
      console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    } else {
      console.log('✗ ERROR: Column not found after migration');
    }
    
    await db.pool.end();
    console.log('\n========================================');
    console.log('Migration process completed');
    console.log('========================================');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ MIGRATION FAILED');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
})();
