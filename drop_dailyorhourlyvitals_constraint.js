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

async function dropDailyOrHourlyVitalsConstraint() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Starting migration to drop PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint...\n');

    // Check if the constraint exists
    const constraintCheck = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conname = 'PatientAdmitVisitVitals_DailyOrHourlyVitals_check'
    `);

    if (constraintCheck.rows.length === 0) {
      console.log('✓ PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint does not exist. Nothing to do.');
      await client.query('COMMIT');
      return;
    }

    console.log('PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint found. Dropping...');

    // Drop the constraint
    await client.query(`
      ALTER TABLE "PatientAdmitVisitVitals"
      DROP CONSTRAINT IF EXISTS "PatientAdmitVisitVitals_DailyOrHourlyVitals_check"
    `);

    console.log('✓ Successfully dropped PatientAdmitVisitVitals_DailyOrHourlyVitals_check constraint');

    await client.query('COMMIT');
    console.log('\nMigration completed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
dropDailyOrHourlyVitalsConstraint()
  .then(() => {
    console.log('\nScript completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

