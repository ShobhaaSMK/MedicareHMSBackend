const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runAllMigrations() {
  try {
    console.log('Starting all PatientICUAdmission migrations...\n');

    // Migration 1: Replace EmergencyBedSlotId with EmergencyAdmissionId
    console.log('=== Migration 1: Replace EmergencyBedSlotId with EmergencyAdmissionId ===');
    const migration1Path = path.join(__dirname, 'migrations', 'replace_emergencybedslotid_with_emergencyadmissionid_in_patienticuadmission.sql');
    const migration1SQL = fs.readFileSync(migration1Path, 'utf8');
    await db.query(migration1SQL);
    console.log('✓ Migration 1 completed\n');

    // Migration 2: Add EmergencyBedId
    console.log('=== Migration 2: Add EmergencyBedId ===');
    const migration2Path = path.join(__dirname, 'migrations', 'add_emergencybedid_to_patienticuadmission.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    await db.query(migration2SQL);
    console.log('✓ Migration 2 completed\n');

    // Migration 3: Add PatientType (if not already done)
    console.log('=== Migration 3: Add PatientType (if needed) ===');
    const migration3Path = path.join(__dirname, 'migrations', 'add_patienttype_to_patienticuadmission.sql');
    if (fs.existsSync(migration3Path)) {
      const migration3SQL = fs.readFileSync(migration3Path, 'utf8');
      await db.query(migration3SQL);
      console.log('✓ Migration 3 completed\n');
    } else {
      console.log('⚠ Migration 3 file not found, skipping...\n');
    }

    console.log('=== Verification ===');
    
    // Verify columns exist
    const checkColumns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND column_name IN ('EmergencyAdmissionId', 'EmergencyBedId', 'PatientType', 'EmergencyBedSlotId')
      ORDER BY column_name
    `);
    
    console.log('\nColumn Status:');
    const existingColumns = checkColumns.rows.map(r => r.column_name);
    console.log(`EmergencyAdmissionId: ${existingColumns.includes('EmergencyAdmissionId') ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`EmergencyBedId: ${existingColumns.includes('EmergencyBedId') ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`PatientType: ${existingColumns.includes('PatientType') ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`EmergencyBedSlotId: ${existingColumns.includes('EmergencyBedSlotId') ? 'STILL EXISTS (should be removed) ✗' : 'REMOVED ✓'}`);

    // Check foreign key constraints
    const checkFKs = await db.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND constraint_name IN (
        'PatientICUAdmission_EmergencyAdmissionId_fkey',
        'PatientICUAdmission_EmergencyBedId_fkey',
        'PatientICUAdmission_EmergencyBedSlotId_fkey'
      )
    `);
    
    console.log('\nForeign Key Constraints:');
    const existingFKs = checkFKs.rows.map(r => r.constraint_name);
    console.log(`EmergencyAdmissionId FK: ${existingFKs.includes('PatientICUAdmission_EmergencyAdmissionId_fkey') ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`EmergencyBedId FK: ${existingFKs.includes('PatientICUAdmission_EmergencyBedId_fkey') ? 'EXISTS ✓' : 'MISSING ✗'}`);
    console.log(`EmergencyBedSlotId FK: ${existingFKs.includes('PatientICUAdmission_EmergencyBedSlotId_fkey') ? 'STILL EXISTS (should be removed) ✗' : 'REMOVED ✓'}`);

    console.log('\n✓ All migrations completed successfully!');

  } catch (error) {
    console.error('✗ Error during migration:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (db.pool) {
      await db.pool.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

if (require.main === module) {
  runAllMigrations();
}

module.exports = runAllMigrations;

