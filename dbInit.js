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
 * Ensure all required tables and columns exist
 * This function checks for missing tables/columns and creates/adds them automatically
 */
async function ensureAllTablesAndColumns(pool) {
  console.log('\n=== Verifying all tables and columns exist ===');
  
  const client = await pool.connect();
  try {
    // List of all required tables (from init_tables.sql and controllers)
    const requiredTables = [
      'Roles', 'Users', 'DoctorDepartment', 'PatientRegistration',
      'RoomBeds', 'LabTest', 'ICU', 'EmergencyBed', 'EmergencyBedSlot',
      'OT', 'OTSlot', 'PatientAppointment', 'PatientLabTest',
      'RoomAdmission', 'EmergencyAdmission', 'EmergencyAdmissionVitals',
      'PatientOTAllocation', 'PatientOTAllocationSlots',
      'PatientAdmitNurseVisits', 'PatientAdmitDoctorVisits',
      'PatientAdmitVisitVitals', 'PatientICUAdmission',
      'ICUDoctorVisits', 'ICUVisitVitals', 'SurgeryProcedure',
      'Bills', 'BillEntity', 'AuditLog'
    ];
    
    // Check which tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = ANY($1::text[])
    `, [requiredTables]);
    
    const existingTables = tablesCheck.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`⚠ Missing tables detected: ${missingTables.join(', ')}`);
      console.log('These should be created by init_tables.sql. Please check the SQL file.');
    } else {
      console.log(`✓ All ${requiredTables.length} required tables exist`);
    }
    
    // Check for missing columns in key tables
    const columnChecks = [
      { table: 'PatientLabTest', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'PatientLabTest', column: 'OrderedByDoctorId', type: 'INTEGER' },
      { table: 'PatientOTAllocation', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'PatientAdmitNurseVisits', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'PatientAdmitDoctorVisits', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'PatientAdmitVisitVitals', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'PatientAdmitVisitVitals', column: 'NurseId', type: 'INTEGER' },
      { table: 'PatientICUAdmission', column: 'RoomAdmissionId', type: 'INTEGER' },
      { table: 'ICUVisitVitals', column: 'VitalsStatus', type: 'VARCHAR(50)' },
      { table: 'EmergencyBed', column: 'EmergencyRoomNameNo', type: 'VARCHAR(100)' },
    ];
    
    let addedColumns = 0;
    for (const { table, column, type } of columnChecks) {
      // Check if table exists first
      const tableExists = existingTables.includes(table);
      if (!tableExists) continue;
      
      // Check if column exists
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      `, [table, column]);
      
      if (columnCheck.rows.length === 0) {
        try {
          await client.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
          console.log(`  ✓ Added column ${table}.${column}`);
          addedColumns++;
        } catch (addError) {
          console.warn(`  ⚠ Could not add column ${table}.${column}: ${addError.message.substring(0, 100)}`);
        }
      }
    }
    
    if (addedColumns > 0) {
      console.log(`\n✓ Added ${addedColumns} missing columns`);
    } else {
      console.log(`✓ All required columns exist`);
    }
    
  } catch (error) {
    console.warn('Error during table/column verification:', error.message);
    throw error;
  } finally {
    client.release();
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

    // First, run a diagnostic check to identify missing columns
    console.log('\n=== Running diagnostic check for missing columns ===');
    try {
      const diagnosticQuery = `
        WITH table_columns AS (
          SELECT 
            t.table_name,
            c.column_name,
            CASE WHEN c.column_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
          FROM information_schema.tables t
          LEFT JOIN information_schema.columns c 
            ON t.table_schema = c.table_schema 
            AND t.table_name = c.table_name
          WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            AND t.table_name IN (
              'PatientLabTest', 'PatientOTAllocation', 'PatientAdmitNurseVisits',
              'PatientAdmitDoctorVisits', 'PatientAdmitVisitVitals', 'PatientICUAdmission',
              'ICUNurseVisitVitals', 'ICUVisitVitals'
            )
        ),
        expected_columns AS (
          SELECT 'PatientLabTest' as table_name, 'RoomAdmissionId' as column_name
          UNION ALL SELECT 'PatientLabTest', 'OrderedByDoctorId'
          UNION ALL SELECT 'PatientOTAllocation', 'RoomAdmissionId'
          UNION ALL SELECT 'PatientAdmitNurseVisits', 'RoomAdmissionId'
          UNION ALL SELECT 'PatientAdmitDoctorVisits', 'RoomAdmissionId'
          UNION ALL SELECT 'PatientAdmitVisitVitals', 'RoomAdmissionId'
          UNION ALL SELECT 'PatientAdmitVisitVitals', 'NurseId'
          UNION ALL SELECT 'PatientICUAdmission', 'RoomAdmissionId'
          UNION ALL SELECT 'ICUNurseVisitVitals', 'VitalsStatus'
          UNION ALL SELECT 'ICUVisitVitals', 'VitalsStatus'
        )
        SELECT 
          ec.table_name,
          ec.column_name,
          CASE 
            WHEN tc.status = 'EXISTS' THEN '✓ EXISTS'
            WHEN tc.status = 'MISSING' THEN '✗ MISSING'
            ELSE '✗ TABLE NOT FOUND'
          END as status
        FROM expected_columns ec
        LEFT JOIN table_columns tc 
          ON ec.table_name = tc.table_name 
          AND ec.column_name = tc.column_name
        ORDER BY ec.table_name, ec.column_name;
      `;
      
      const diagnosticResult = await pool.query(diagnosticQuery);
      console.log('\nColumn Status Check:');
      diagnosticResult.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name}: ${row.status}`);
      });
      
      const missingColumns = diagnosticResult.rows.filter(r => r.status.includes('MISSING') || r.status.includes('NOT FOUND'));
      if (missingColumns.length > 0) {
        console.log('\n⚠️  WARNING: Missing columns detected:');
        missingColumns.forEach(row => {
          console.error(`  - ${row.table_name}.${row.column_name}: ${row.status}`);
        });
        console.log('\nThese columns will be added automatically if possible.\n');
      } else {
        console.log('\n✓ All expected columns exist\n');
      }
    } catch (diagError) {
      console.error('Could not run diagnostic check:', diagError.message);
    }

    // Execute the SQL script
    // The SQL file uses IF NOT EXISTS clauses, so it's safe to execute multiple times
    try {
      await pool.query(sql);
      console.log('✓ SQL script executed successfully');
    } catch (sqlError) {
      // Check if it's a non-critical error we can ignore
      const errorMsg = sqlError.message.toLowerCase();
      const isNonCritical = 
        errorMsg.includes('already exists') ||
        errorMsg.includes('duplicate') ||
        (errorMsg.includes('constraint') && errorMsg.includes('already')) ||
        (errorMsg.includes('relation') && errorMsg.includes('already'));
      
      if (isNonCritical) {
        console.log('⚠ Non-critical SQL warning (continuing):', sqlError.message.substring(0, 150));
      } else {
        // Log the error but continue - we'll try to fix it in verification
        console.warn('⚠ SQL Error (will attempt to fix):', sqlError.message.substring(0, 200));
        console.warn('  Continuing with table/column verification...');
      }
    }
    
    // After SQL execution, verify and fix any missing tables/columns
    // This will automatically add any missing columns
    try {
      await ensureAllTablesAndColumns(pool);
    } catch (verifyError) {
      console.warn('⚠ Warning during table/column verification:', verifyError.message);
    }

    // Check which tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
        AND table_name IN (
          'Roles', 'Users', 'DoctorDepartment', 'PatientRegistration',
          'RoomBeds', 'LabTest', 'ICU', 'EmergencyBed', 'OT', 'PatientAppointment', 'PatientLabTest', 'RoomAdmission', 'EmergencyAdmission', 'EmergencyAdmissionVitals', 'PatientOTAllocation', 'PatientAdmitNurseVisits', 'PatientICUAdmission', 'ICUDoctorVisits', 'ICUVisitVitals', 'PatientAdmitVisitVitals', 'PatientAdmitDoctorVisits'
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

