/**
 * Script to run the migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in RoomAdmission table
 * Run with: node run_roomadmission_migration.js
 */

const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migration: Replace EmergencyBedSlotId with EmergencyAdmissionId in RoomAdmission table...\n');

    // Read the migration file
    const migrationFilePath = path.join(__dirname, 'migrations', 'replace_emergencybedslotid_with_emergencyadmissionid_in_roomadmission.sql');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

    // Execute the migration
    await db.query(migrationSQL);
    console.log('✓ Migration SQL executed successfully\n');

    // Verify the changes
    console.log('--- Verifying migration ---\n');

    // Check if EmergencyBedSlotId column exists
    const checkOldColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'RoomAdmission' 
      AND column_name = 'EmergencyBedSlotId'
    `);
    console.log(`EmergencyBedSlotId column exists: ${checkOldColumn.rows.length > 0 ? 'YES (should be removed)' : 'NO ✓'}`);

    // Check if EmergencyAdmissionId column exists
    const checkNewColumn = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'RoomAdmission' 
      AND column_name = 'EmergencyAdmissionId'
    `);
    console.log(`EmergencyAdmissionId column exists: ${checkNewColumn.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);
    if (checkNewColumn.rows.length > 0) {
      console.log(`  - Data Type: ${checkNewColumn.rows[0].data_type}`);
      console.log(`  - Nullable: ${checkNewColumn.rows[0].is_nullable}`);
    }

    // Check foreign key constraint
    const checkFK = await db.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'RoomAdmission'
      AND constraint_name = 'RoomAdmission_EmergencyAdmissionId_fkey'
    `);
    console.log(`Foreign key constraint exists: ${checkFK.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);

    console.log('\n✓ Migration verification completed.\n');

  } catch (error) {
    console.error('Error running migration:', error);
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
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };

