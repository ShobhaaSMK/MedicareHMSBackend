const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting migration: Replace EmergencyBedSlotId with EmergencyBedId in EmergencyAdmission table...\n');

    const migrationFilePath = path.join(__dirname, 'migrations', 'replace_emergencybedslotid_with_emergencybedid_in_emergencyadmission.sql');
    const sql = fs.readFileSync(migrationFilePath, 'utf8');

    // Execute the migration SQL
    await db.query(sql);

    console.log('\n✓ Migration completed successfully.');

    // Optional: Verify column existence after migration
    const checkOldColumn = await db.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'EmergencyAdmission'
      AND column_name = 'EmergencyBedSlotId'
    `);
    console.log(`EmergencyBedSlotId column exists: ${checkOldColumn.rows.length > 0 ? 'YES (should be removed)' : 'NO ✓'}`);

    const checkNewColumn = await db.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'EmergencyAdmission'
      AND column_name = 'EmergencyBedId'
    `);
    console.log(`EmergencyBedId column exists: ${checkNewColumn.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);

    // Check foreign key constraint
    const checkFK = await db.query(`
      SELECT 1 FROM pg_constraint
      WHERE conname = 'EmergencyAdmission_EmergencyBedId_fkey'
    `);
    console.log(`EmergencyBedId foreign key constraint exists: ${checkFK.rows.length > 0 ? 'YES ✓' : 'NO (should be added)'}`);

  } catch (error) {
    console.error('✗ Error during migration:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    if (db.pool) {
      await db.pool.end();
      console.log('Database connection closed.');
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = runMigration;

