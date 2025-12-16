const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medicarehms',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('Running Migration: Change CreatedBy from UUID to INTEGER in PatientLabTest');
    console.log('========================================\n');
    
    const sqlPath = path.join(__dirname, 'change_createdby_to_integer_patient_lab_test.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ CreatedBy column has been changed from UUID to INTEGER');
    console.log('✓ Foreign key constraint added to Users table');
    console.log('✓ Index created on CreatedBy column');
    console.log('\nNote: Existing UUID values have been set to NULL (cannot convert UUID to integer)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);

