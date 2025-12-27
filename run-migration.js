const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration(migrationFile) {
  // Get database configuration from environment variables
  const dbName = process.env.PGDATABASE;
  const dbHost = process.env.PGHOST || 'localhost';
  const dbPort = process.env.PGPORT || 5432;
  const dbUser = process.env.PGUSER || 'postgres';
  const dbPassword = process.env.PGPASSWORD || '';

  // If DATABASE_URL is provided, parse it
  let parsedConfig = {};
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      parsedConfig = {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading '/'
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error.message);
    }
  }

  // Use parsed config if available, otherwise use individual env vars
  const config = {
    host: parsedConfig.host || dbHost,
    port: parsedConfig.port || dbPort,
    user: parsedConfig.user || dbUser,
    password: parsedConfig.password || dbPassword,
    database: parsedConfig.database || dbName,
  };

  if (!config.database) {
    console.error('Database name not specified in environment variables (PGDATABASE or DATABASE_URL)');
    process.exit(1);
  }

  const pool = new Pool(config);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);

    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      console.error('Migration file is empty');
      process.exit(1);
    }

    console.log(`Running migration: ${migrationFile}`);
    console.log('=====================================');

    // Execute the migration
    await pool.query(sql);

    console.log('=====================================');
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-migration.js <migration-file>');
  process.exit(1);
}

runMigration(migrationFile);
