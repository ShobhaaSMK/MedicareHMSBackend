/**
 * Script to run the migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in RoomAdmission table
 * Run with: node run_migration.js
 */

const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in RoomAdmission table...\n');

    // Read the migration SQL file
    const migrationFilePath = path.join(__dirname, 'migrations', 'replace_emergencybedslotid_with_emergencyadmissionid_in_roomadmission.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

    // Execute the migration
    console.log('Executing migration SQL...\n');
    await db.query(migrationSQL);

    console.log('✓ Migration executed successfully!\n');

    // Verify the changes
    console.log('Verifying migration changes...\n');

    // Check if EmergencyBedSlotId column exists
    const checkOldColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'RoomAdmission' 
      AND column_name = 'EmergencyBedSlotId'
    `);

    // Check if EmergencyAdmissionId column exists
    const checkNewColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'RoomAdmission' 
      AND column_name = 'EmergencyAdmissionId'
    `);

    // Check foreign key constraint
    const checkFK = await db.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'RoomAdmission_EmergencyAdmissionId_fkey'
    `);

    console.log('Migration Status:');
    console.log('─'.repeat(60));
    console.log(`EmergencyBedSlotId column exists: ${checkOldColumn.rows.length > 0 ? 'YES (should be removed)' : 'NO ✓'}`);
    console.log(`EmergencyAdmissionId column exists: ${checkNewColumn.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);
    console.log(`Foreign key constraint exists: ${checkFK.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);
    console.log('─'.repeat(60));

    if (checkOldColumn.rows.length === 0 && checkNewColumn.rows.length > 0 && checkFK.rows.length > 0) {
      console.log('\n✓ Migration completed successfully!');
      console.log('✓ EmergencyBedSlotId column removed');
      console.log('✓ EmergencyAdmissionId column added');
      console.log('✓ Foreign key constraint added\n');
    } else {
      console.log('\n⚠ Migration may not have completed fully. Please check the status above.\n');
    }

  } catch (error) {
    console.error('\n✗ Error running migration:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    // Close the database connection
    if (db.pool) {
      await db.pool.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };

