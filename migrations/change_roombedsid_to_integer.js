require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.PGHOST || process.env.DB_HOST || 'localhost',
  port: process.env.PGPORT || process.env.DB_PORT || 5432,
  database: process.env.PGDATABASE || process.env.DB_NAME || 'medicarehms',
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Change RoomBedsId from UUID to INTEGER...');
    
    const sql = fs.readFileSync(
      path.join(__dirname, 'change_roombedsid_to_integer.sql'),
      'utf8'
    );
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✓ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

