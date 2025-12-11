require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Running Migration: Add Missing Columns to ICUVisitVitals');
    console.log('========================================\n');
    
    const migrationPath = path.join(__dirname, 'add_missing_columns_to_icu_visit_vitals.sql');
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
      AND table_name = 'ICUVisitVitals'
      AND column_name IN ('DailyOrHourlyVitals', 'PatientCondition', 'BloodSugar', 'NurseId')
      ORDER BY column_name;
    `;
    
    const verifyResult = await db.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✓ SUCCESS: Columns exist in ICUVisitVitals table');
      console.log('\nColumn Details:');
      verifyResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
    } else {
      console.log('⚠ Warning: Some columns not found after migration');
    }
    
    // Check all columns in the table
    console.log('\nAll columns in ICUVisitVitals table:');
    const allColumnsQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ICUVisitVitals'
      ORDER BY ordinal_position;
    `;
    
    const allColumnsResult = await db.query(allColumnsQuery);
    allColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
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

