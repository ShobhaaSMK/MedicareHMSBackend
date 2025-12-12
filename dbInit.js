const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Initialize database - create if it doesn't exist
 * @returns {Promise<{success: boolean, message: string, created: boolean}>}
 */
async function initializeDatabase() {
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
  };

  // Determine target database name
  const targetDbName = parsedConfig.database || dbName;

  if (!targetDbName) {
    return {
      success: false,
      message: 'Database name not specified in environment variables (PGDATABASE or DATABASE_URL)',
      created: false,
    };
  }

  // Connect to PostgreSQL server (using default 'postgres' database to check/create target database)
  const adminPool = new Pool({
    ...config,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    // Check if database exists
    const checkQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const checkResult = await adminPool.query(checkQuery, [targetDbName]);

    if (checkResult.rows.length > 0) {
      // Database already exists
      await adminPool.end();
      return {
        success: true,
        message: `Database '${targetDbName}' already exists`,
        created: false,
      };
    }

    // Database doesn't exist, create it
    // Note: CREATE DATABASE cannot be executed with parameters, so we need to use string interpolation
    // Sanitize the database name by escaping double quotes
    const sanitizedDbName = targetDbName.replace(/"/g, '""');
    
    // Create the database with proper quoting
    const createQuery = `CREATE DATABASE "${sanitizedDbName}"`;
    await adminPool.query(createQuery);

    await adminPool.end();

    return {
      success: true,
      message: `Database '${targetDbName}' created successfully`,
      created: true,
    };
  } catch (error) {
    await adminPool.end();
    return {
      success: false,
      message: `Error initializing database: ${error.message}`,
      created: false,
      error: error.message,
    };
  }
}

/**
 * Initialize tables - create if they don't exist
 * @returns {Promise<{success: boolean, message: string, tablesCreated: number}>}
 */
async function initializeTables() {
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
    return {
      success: false,
      message: 'Database name not specified in environment variables (PGDATABASE or DATABASE_URL)',
      tablesCreated: 0,
    };
  }

  // Connect to the target database
  const pool = new Pool(config);

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'init_tables.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      await pool.end();
      return {
        success: false,
        message: `SQL file not found: ${sqlFilePath}`,
        tablesCreated: 0,
        error: 'SQL file not found',
      };
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      await pool.end();
      return {
        success: false,
        message: 'SQL file is empty',
        tablesCreated: 0,
        error: 'SQL file is empty',
      };
    }

    // Execute the SQL script
    // The SQL file uses IF NOT EXISTS clauses, so it's safe to execute multiple times
    try {
      await pool.query(sql);
      console.log('✓ SQL script executed successfully');
    } catch (sqlError) {
      console.error('✗ Error executing SQL script:', sqlError.message);
      console.error('SQL Error Code:', sqlError.code);
      console.error('SQL Error Detail:', sqlError.detail);
      throw sqlError;
    }

    // Check which tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
        AND table_name IN (
          'Roles', 'Users', 'DoctorDepartment', 'PatientRegistration',
          'RoomBeds', 'LabTest', 'ICU', 'EmergencyBed', 'OT', 'PatientAppointment', 'PatientLabTest', 'RoomAdmission', 'EmergencyAdmission', 'EmergencyAdmissionVitals', 'PatientOTAllocation', 'PatientICUAdmission', 'ICUDoctorVisits', 'ICUVisitVitals', 'PatientAdmitVisitVitals', 'PatientAdmitDoctorVisits'
        )
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);

    await pool.end();

    return {
      success: true,
      message: `Tables initialized successfully. Found ${existingTables.length} tables: ${existingTables.join(', ')}`,
      tablesCreated: existingTables.length,
      tables: existingTables,
    };
  } catch (error) {
    await pool.end();
    return {
      success: false,
      message: `Error initializing tables: ${error.message}`,
      tablesCreated: 0,
      error: error.message,
    };
  }
}

/**
 * Initialize both database and tables
 * @returns {Promise<{dbResult: object, tablesResult: object}>}
 */
async function initializeDatabaseAndTables() {
  const dbResult = await initializeDatabase();
  const tablesResult = await initializeTables();
  return { dbResult, tablesResult };
}

module.exports = { 
  initializeDatabase, 
  initializeTables,
  initializeDatabaseAndTables 
};

