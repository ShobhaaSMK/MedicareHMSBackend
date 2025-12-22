require('dotenv').config();
const { Pool } = require('pg');

const poolConfig = {
  host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
  port: process.env.PGPORT || process.env.DB_PORT || 5432,
  database: process.env.PGDATABASE || process.env.DB_NAME || 'medicarehms',
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
};

const pool = new Pool(poolConfig);

async function dropEmergencyBedIdColumn() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to drop EmergencyBedId column from PatientICUAdmission table...\n');

    // Check if the column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'PatientICUAdmission' 
      AND column_name = 'EmergencyBedId'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('✓ EmergencyBedId column does not exist. Nothing to do.');
      return;
    }

    console.log('EmergencyBedId column found. Checking for foreign key constraints...');

    // Check for foreign key constraint
    const fkCheck = await client.query(`
      SELECT tc.constraint_name 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'PatientICUAdmission' 
        AND kcu.column_name = 'EmergencyBedId'
        AND tc.constraint_type = 'FOREIGN KEY'
    `);

    if (fkCheck.rows.length > 0) {
      const constraintName = fkCheck.rows[0].constraint_name;
      console.log(`Dropping foreign key constraint: ${constraintName}`);
      await client.query(`
        ALTER TABLE "PatientICUAdmission" 
        DROP CONSTRAINT IF EXISTS "${constraintName}"
      `);
      console.log(`✓ Dropped constraint: ${constraintName}`);
    }

    // Drop the column
    console.log('Dropping EmergencyBedId column...');
    await client.query(`
      ALTER TABLE "PatientICUAdmission" 
      DROP COLUMN IF EXISTS "EmergencyBedId"
    `);

    console.log('✓ Successfully dropped EmergencyBedId column from PatientICUAdmission table');
    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
dropEmergencyBedIdColumn()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

