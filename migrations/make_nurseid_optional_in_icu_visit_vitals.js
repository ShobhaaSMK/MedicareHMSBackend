require('dotenv').config();
const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('========================================');
    console.log('Running Migration: Make NurseId Optional in ICUVisitVitals');
    console.log('========================================\n');
    
    const migrationPath = path.join(__dirname, 'make_nurseid_optional_in_icu_visit_vitals.sql');
    console.log('Reading migration file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('\nExecuting migration SQL...');
    await db.query(migrationSQL);
    console.log('✓ Migration SQL executed successfully');
    
    // Verify column is nullable
    console.log('\nVerifying column is nullable...');
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ICUVisitVitals'
      AND column_name = 'NurseId';
    `;
    
    const verifyResult = await db.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      const column = verifyResult.rows[0];
      console.log('✓ SUCCESS: NurseId column details:');
      console.log(`  - Column: ${column.column_name}`);
      console.log(`  - Type: ${column.data_type}`);
      console.log(`  - Nullable: ${column.is_nullable}`);
      
      if (column.is_nullable === 'YES') {
        console.log('✓ NurseId is now nullable (optional)');
      } else {
        console.log('⚠ Warning: NurseId is still NOT NULL');
      }
    } else {
      console.log('⚠ Warning: NurseId column not found');
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

