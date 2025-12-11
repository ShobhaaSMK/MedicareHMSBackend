require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Running Migration: Add Fields to PatientAdmitVisitVitals');
    console.log('========================================\n');
    
    const migrationPath = path.join(__dirname, 'add_fields_to_patient_admit_visit_vitals.sql');
    console.log('Reading migration file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\nExecuting migration SQL...');
    await db.query(migrationSQL);
    console.log('✓ Migration SQL executed successfully');
    
    // Verify columns exist
    console.log('\nVerifying columns exist...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientAdmitVisitVitals'
      AND column_name IN ('NurseId', 'PatientStatus', 'VisitRemarks')
      ORDER BY column_name;
    `;
    
    const verifyResult = await db.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ SUCCESS: Columns exist in PatientAdmitVisitVitals table');
      console.log('\nColumn Details:');
      verifyResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('⚠ Warning: Some columns not found after migration');
    }
    
    // Verify foreign key constraint
    console.log('\nVerifying foreign key constraint...');
    const fkQuery = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'PatientAdmitVisitVitals'
      AND constraint_name = 'PatientAdmitVisitVitals_NurseId_fkey';
    `;
    
    const fkResult = await db.query(fkQuery);
    if (fkResult.rows.length > 0) {
      console.log('✓ Foreign key constraint exists');
    } else {
      console.log('⚠ Warning: Foreign key constraint not found');
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
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

