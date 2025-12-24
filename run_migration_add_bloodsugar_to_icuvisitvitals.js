require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Add BloodSugar column to ICUVisitVitals...\n');

  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'add_bloodsugar_to_icuvisitvitals.sql');

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

    // Verify the column was added
    const checkQuery = `
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'ICUVisitVitals'
      AND column_name = 'BloodSugar';
    `;

    const { rows } = await db.query(checkQuery);

    if (rows.length > 0) {
      console.log('✓ BloodSugar column added successfully:');
      console.log(`  - Column: ${rows[0].column_name}`);
      console.log(`  - Type: ${rows[0].data_type}`);
      console.log(`  - Precision: ${rows[0].numeric_precision}`);
      console.log(`  - Scale: ${rows[0].numeric_scale}`);
    } else {
      console.log('✗ BloodSugar column was not found after migration');
    }

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log('Migration completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});