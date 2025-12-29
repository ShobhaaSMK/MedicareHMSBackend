const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Dynamically scan controllers to extract table and column information
 * This makes the system self-updating when new APIs are added
 */
function scanControllersForTablesAndColumns() {
  const controllersDir = path.join(__dirname, 'controllers');
  const tablesUsed = new Set();
  const columnsByTable = {};
  
  if (!fs.existsSync(controllersDir)) {
    console.warn('⚠ Controllers directory not found, skipping dynamic scan');
    return { tablesUsed: [], columnsByTable: {} };
  }
  
  const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('Controller.js'));
  
  // Pattern to match table names in SQL queries
  const tablePattern = /FROM\s+"(\w+)"|INTO\s+"(\w+)"|UPDATE\s+"(\w+)"|JOIN\s+"(\w+)"/gi;
  
  controllerFiles.forEach(file => {
    const filePath = path.join(controllersDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract table names from SQL queries
    let match;
    const tablePatternReset = new RegExp(tablePattern.source, tablePattern.flags);
    while ((match = tablePatternReset.exec(content)) !== null) {
      const tableName = match[1] || match[2] || match[3] || match[4];
      if (tableName && !tableName.match(/^(SELECT|WHERE|AND|OR|ORDER|GROUP|HAVING|LIMIT|OFFSET)$/i)) {
        tablesUsed.add(tableName);
      }
    }
    
    // Extract columns from INSERT statements: INSERT INTO "Table" ("Col1", "Col2", ...)
    const insertPattern = /INSERT\s+INTO\s+"(\w+)"\s*\(([^)]+)\)/gi;
    let insertMatch;
    while ((insertMatch = insertPattern.exec(content)) !== null) {
      const tableName = insertMatch[1];
      const columnsStr = insertMatch[2];
      tablesUsed.add(tableName);
      
      // Extract column names from the column list
      const columnNames = columnsStr.match(/"(\w+)"/g);
      if (columnNames) {
        if (!columnsByTable[tableName]) {
          columnsByTable[tableName] = new Set();
        }
        columnNames.forEach(col => {
          const colName = col.replace(/"/g, '');
          columnsByTable[tableName].add(colName);
        });
      }
    }
    
    // Extract columns from UPDATE statements: UPDATE "Table" SET "Col1" = ..., "Col2" = ...
    const updatePattern = /UPDATE\s+"(\w+)"\s+SET\s+([^WHERE]+?)(?:\s+WHERE|\s*$)/gi;
    let updateMatch;
    while ((updateMatch = updatePattern.exec(content)) !== null) {
      const tableName = updateMatch[1];
      const setClause = updateMatch[2];
      tablesUsed.add(tableName);
      
      // Extract column names from SET clause
      const setColumns = setClause.match(/"(\w+)"\s*=/g);
      if (setColumns) {
        if (!columnsByTable[tableName]) {
          columnsByTable[tableName] = new Set();
        }
        setColumns.forEach(col => {
          const colName = col.match(/"(\w+)"/)[1];
          columnsByTable[tableName].add(colName);
        });
      }
    }
    
    // Extract columns from SELECT statements: SELECT "Col1", "Col2", ... FROM "Table"
    const selectPattern = /SELECT\s+([^FROM]+?)\s+FROM\s+"(\w+)"/gi;
    let selectMatch;
    while ((selectMatch = selectPattern.exec(content)) !== null) {
      const tableName = selectMatch[2];
      const selectClause = selectMatch[1];
      tablesUsed.add(tableName);
      
      // Extract column names (handle both "Column" and table."Column" formats)
      const selectColumns = selectClause.match(/(?:"\w+"\.)?"(\w+)"/g);
      if (selectColumns) {
        if (!columnsByTable[tableName]) {
          columnsByTable[tableName] = new Set();
        }
        selectColumns.forEach(col => {
          const colMatch = col.match(/"(\w+)"/);
          if (colMatch) {
            columnsByTable[tableName].add(colMatch[1]);
          }
        });
      }
    }
    
    // Extract columns from map functions
    // Pattern: const mapXxxRow = (row) => ({ ColumnName: row.ColumnName || row.columnname, ... })
    const mapFunctionPattern = /const\s+map\w+Row\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\};/g;
    let mapMatch;
    
    while ((mapMatch = mapFunctionPattern.exec(content)) !== null) {
      const mapBody = mapMatch[1];
      
      // Extract column names from map function
      // Pattern: ColumnName: row.ColumnName || row.columnname
      const columnPattern = /(\w+):\s*row\.(\w+)/g;
      let colMatch;
      
      while ((colMatch = columnPattern.exec(mapBody)) !== null) {
        const columnName = colMatch[1];
        // Convert camelCase to PascalCase (database column format)
        const dbColumnName = columnName
          .replace(/([A-Z])/g, ' $1')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('');
        
        // Try to determine table name from controller file name
        // e.g., patientLabTestController.js -> PatientLabTest
        const tableNameMatch = file.match(/(\w+)Controller\.js$/);
        if (tableNameMatch) {
          const controllerName = tableNameMatch[1];
          // Convert camelCase controller name to PascalCase table name
          const tableName = controllerName
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          // Store column for this table
          if (!columnsByTable[tableName]) {
            columnsByTable[tableName] = new Set();
          }
          columnsByTable[tableName].add(dbColumnName);
        }
      }
    }
  });
  
  // Convert Sets to Arrays for easier handling
  const columnsByTableArray = {};
  Object.keys(columnsByTable).forEach(table => {
    columnsByTableArray[table] = Array.from(columnsByTable[table]);
  });
  
  return {
    tablesUsed: Array.from(tablesUsed),
    columnsByTable: columnsByTableArray
  };
}

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
 * Infer column type from column name and usage patterns
 */
function inferColumnType(columnName, tableName) {
  // UUID columns
  if (columnName === 'PatientId' || columnName.endsWith('Id') && (columnName.includes('Patient') || columnName.includes('Role'))) {
    if (columnName === 'PatientId' || columnName === 'RoleId') {
      return 'UUID';
    }
  }
  
  // Integer ID columns (most common)
  if (columnName.endsWith('Id') && columnName !== 'PatientId' && columnName !== 'RoleId') {
    return 'INTEGER';
  }
  
  // Date/Time columns
  if (columnName.includes('Date') || columnName.includes('DateTime') || columnName.includes('At') || columnName.includes('Time')) {
    return 'TIMESTAMP';
  }
  
  // Decimal/Numeric columns
  if (columnName.includes('Amount') || columnName.includes('Charge') || columnName.includes('Rate') || 
      columnName.includes('Price') || columnName.includes('Cost') || columnName.includes('Fee')) {
    return 'DECIMAL(10, 2)';
  }
  
  // Status columns
  if (columnName.includes('Status')) {
    return 'VARCHAR(50)';
  }
  
  // Text columns
  if (columnName.includes('Remarks') || columnName.includes('Details') || columnName.includes('Description') || 
      columnName.includes('Notes') || columnName.includes('CaseSheet') || columnName.includes('Document')) {
    return 'TEXT';
  }
  
  // Phone/Number columns
  if (columnName.includes('Phone') || columnName.includes('No') && !columnName.includes('Number')) {
    return 'VARCHAR(50)';
  }
  
  // Email columns
  if (columnName.includes('Email')) {
    return 'VARCHAR(255)';
  }
  
  // Name columns
  if (columnName.includes('Name')) {
    return 'VARCHAR(255)';
  }
  
  // Boolean-like columns (Yes/No)
  if (columnName.includes('Is') || columnName.includes('Has') || columnName.includes('Transfer') || 
      columnName.includes('Schedule') || columnName.includes('Linked')) {
    return 'VARCHAR(10)';
  }
  
  // Default to VARCHAR(255)
  return 'VARCHAR(255)';
}

/**
 * Create a basic table structure for a missing table
 */
async function createBasicTable(client, tableName, columns) {
  try {
    // Determine primary key column
    let primaryKey = null;
    if (columns.includes(`${tableName}Id`)) {
      primaryKey = `${tableName}Id`;
    } else if (tableName === 'PatientRegistration' && columns.includes('PatientId')) {
      primaryKey = 'PatientId';
    } else if (tableName === 'Roles' && columns.includes('RoleId')) {
      primaryKey = 'RoleId';
    }
    
    // Build column definitions
    const columnDefs = [];
    
    // Add primary key
    if (primaryKey) {
      const pkType = primaryKey === 'PatientId' || primaryKey === 'RoleId' ? 'UUID DEFAULT gen_random_uuid()' : 'SERIAL';
      columnDefs.push(`"${primaryKey}" ${pkType} PRIMARY KEY`);
    }
    
    // Add other columns
    columns.forEach(col => {
      if (col === primaryKey) return; // Skip primary key, already added
      
      const colType = inferColumnType(col, tableName);
      columnDefs.push(`"${col}" ${colType}`);
    });
    
    // Add common columns if not present
    if (!columns.includes('Status')) {
      columnDefs.push('"Status" VARCHAR(50) DEFAULT \'Active\'');
    }
    if (!columns.includes('CreatedAt')) {
      columnDefs.push('"CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }
    
    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs.join(', ')})`;
    await client.query(createTableSQL);
    console.log(`  ✓ Created table "${tableName}" with ${columnDefs.length} columns`);
    return true;
  } catch (error) {
    console.warn(`  ⚠ Could not create table "${tableName}": ${error.message.substring(0, 100)}`);
    return false;
  }
}

/**
 * Ensure all required tables and columns exist
 * This function checks for missing tables/columns and creates/adds them automatically
 * Can be disabled by setting AUTO_CREATE_MISSING_TABLES=false in environment
 */
async function ensureAllTablesAndColumns(pool) {
  // Check if auto-creation is enabled (default: true)
  const autoCreate = process.env.AUTO_CREATE_MISSING_TABLES !== 'false';
  
  if (!autoCreate) {
    console.log('\n⚠ Auto-creation of missing tables/columns is disabled (AUTO_CREATE_MISSING_TABLES=false)');
    return;
  }
  
  console.log('\n=== Verifying all tables and columns exist ===');
  
  const client = await pool.connect();
  try {
    // Dynamically scan controllers to find all tables and columns being used
    console.log('📊 Scanning controllers for tables and columns...');
    const { tablesUsed: scannedTables, columnsByTable: scannedColumns } = scanControllersForTablesAndColumns();
    
    // Base list of all required tables (from init_tables.sql - all 26 tables)
    // This ensures we check all tables defined in the schema
    const baseTables = [
      'Roles', 'DoctorDepartment', 'Users', 'PatientRegistration',
      'RoomBeds', 'LabTest', 'ICU',
      'EmergencyBed', 'EmergencyBedSlot', 'OT', 'OTSlot',
      'PatientAppointment', 'PatientICUAdmission', 'RoomAdmission',
      'PatientLabTest', 'SurgeryProcedure', 'PatientOTAllocation',
      'PatientOTAllocationSlots', 'EmergencyAdmission', 'EmergencyAdmissionVitals',
      'ICUDoctorVisits', 'ICUVisitVitals',
      'PatientAdmitDoctorVisits', 'PatientAdmitVisitVitals', 'AuditLog'
    ];
    
    // Combine base tables with scanned tables (removes duplicates)
    const requiredTables = Array.from(new Set([...baseTables, ...scannedTables])).sort();
    
    if (scannedTables.length > 0) {
      console.log(`  ✓ Found ${scannedTables.length} tables in controllers: ${scannedTables.slice(0, 5).join(', ')}${scannedTables.length > 5 ? '...' : ''}`);
    }
    
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
    
    // Create missing tables
    let createdTables = 0;
    if (missingTables.length > 0) {
      console.log(`⚠ Missing tables detected: ${missingTables.join(', ')}`);
      console.log('  Creating missing tables...');
      
      for (const tableName of missingTables) {
        const columns = scannedColumns[tableName] || [];
        if (await createBasicTable(client, tableName, columns)) {
          createdTables++;
          existingTables.push(tableName); // Add to existing list for column checks
        }
      }
      
      if (createdTables > 0) {
        console.log(`  ✓ Created ${createdTables} missing table(s)`);
      }
    } else {
      console.log(`✓ All ${requiredTables.length} required tables exist`);
    }
    
    // Build column checks from both static list and dynamically scanned columns
    // Static list for known columns that might be missing (legacy support)
    // Using improved type inference for consistency
    const staticColumnChecks = [
      { table: 'PatientLabTest', column: 'RoomAdmissionId', type: inferColumnType('RoomAdmissionId', 'PatientLabTest') },
      { table: 'PatientLabTest', column: 'OrderedByDoctorId', type: inferColumnType('OrderedByDoctorId', 'PatientLabTest') },
      { table: 'PatientLabTest', column: 'Priority', type: inferColumnType('Priority', 'PatientLabTest') },
      { table: 'PatientOTAllocation', column: 'RoomAdmissionId', type: inferColumnType('RoomAdmissionId', 'PatientOTAllocation') },
      { table: 'PatientOTAllocation', column: 'NurseId', type: inferColumnType('NurseId', 'PatientOTAllocation') },
      { table: 'PatientAdmitDoctorVisits', column: 'RoomAdmissionId', type: inferColumnType('RoomAdmissionId', 'PatientAdmitDoctorVisits') },
      { table: 'PatientAdmitVisitVitals', column: 'RoomAdmissionId', type: inferColumnType('RoomAdmissionId', 'PatientAdmitVisitVitals') },
      { table: 'PatientAdmitVisitVitals', column: 'NurseId', type: inferColumnType('NurseId', 'PatientAdmitVisitVitals') },
      { table: 'PatientAdmitVisitVitals', column: 'PatientStatus', type: inferColumnType('PatientStatus', 'PatientAdmitVisitVitals') },
      { table: 'PatientAdmitVisitVitals', column: 'VisitRemarks', type: inferColumnType('VisitRemarks', 'PatientAdmitVisitVitals') },
      { table: 'PatientAdmitVisitVitals', column: 'VitalsStatus', type: inferColumnType('VitalsStatus', 'PatientAdmitVisitVitals') },
      { table: 'PatientICUAdmission', column: 'RoomAdmissionId', type: inferColumnType('RoomAdmissionId', 'PatientICUAdmission') },
      { table: 'PatientICUAdmission', column: 'OnVentilator', type: 'VARCHAR(10) DEFAULT \'No\'' },
      { table: 'PatientICUAdmission', column: 'ICUAdmissionStatus', type: 'VARCHAR(50) DEFAULT \'Occupied\'' },
      { table: 'ICUVisitVitals', column: 'VitalsStatus', type: inferColumnType('VitalsStatus', 'ICUVisitVitals') },
      { table: 'ICUVisitVitals', column: 'NurseId', type: inferColumnType('NurseId', 'ICUVisitVitals') },
      { table: 'EmergencyAdmissionVitals', column: 'NurseId', type: inferColumnType('NurseId', 'EmergencyAdmissionVitals') },
      { table: 'EmergencyAdmissionVitals', column: 'VitalsStatus', type: inferColumnType('VitalsStatus', 'EmergencyAdmissionVitals') },
      { table: 'EmergencyBed', column: 'EmergencyRoomNameNo', type: inferColumnType('EmergencyRoomNameNo', 'EmergencyBed') },
      { table: 'EmergencyBed', column: 'ChargesPerDay', type: inferColumnType('ChargesPerDay', 'EmergencyBed') },
      { table: 'PatientOTAllocationSlots', column: 'OTAllocationDate', type: inferColumnType('OTAllocationDate', 'PatientOTAllocationSlots') },
    ];
    
    // Convert scanned columns to column checks format
    // Note: We infer column types from common patterns, but this is a best-effort approach
    const dynamicColumnChecks = [];
    Object.entries(scannedColumns).forEach(([table, columns]) => {
      columns.forEach(column => {
        // Use improved type inference
        const columnType = inferColumnType(column, table);
        dynamicColumnChecks.push({ table, column, type: columnType });
      });
    });
    
    // Combine static and dynamic column checks, removing duplicates
    const columnChecksMap = new Map();
    [...staticColumnChecks, ...dynamicColumnChecks].forEach(check => {
      const key = `${check.table}.${check.column}`;
      if (!columnChecksMap.has(key)) {
        columnChecksMap.set(key, check);
      } else {
        // Prefer static type if available (more accurate)
        if (staticColumnChecks.find(c => c.table === check.table && c.column === check.column)) {
          columnChecksMap.set(key, check);
        }
      }
    });
    
    const columnChecks = Array.from(columnChecksMap.values());
    
    if (dynamicColumnChecks.length > 0) {
      console.log(`  ✓ Found ${dynamicColumnChecks.length} columns from controller map functions`);
    }
    
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
          // Handle UUID type - need to ensure extension exists
          if (type === 'UUID') {
            try {
              await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
            } catch (extError) {
              // Extension might already exist or not have permission, continue
            }
          }
          
          await client.query(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
          console.log(`  ✓ Added column ${table}.${column} (${type})`);
          addedColumns++;
          
          // Add CHECK constraints for specific columns if needed
          if (table === 'PatientICUAdmission' && column === 'OnVentilator') {
            try {
              await client.query(`
                ALTER TABLE "${table}" 
                ADD CONSTRAINT "${table}_${column}_check" 
                CHECK ("${column}" IN ('Yes', 'No'))
              `);
              console.log(`  ✓ Added CHECK constraint for ${table}.${column}`);
            } catch (constraintError) {
              // Constraint might already exist, ignore
            }
          }
          
          if (table === 'PatientICUAdmission' && column === 'ICUAdmissionStatus') {
            try {
              await client.query(`
                ALTER TABLE "${table}" 
                ADD CONSTRAINT "${table}_${column}_check" 
                CHECK ("${column}" IN ('Occupied', 'Discharged'))
              `);
              console.log(`  ✓ Added CHECK constraint for ${table}.${column}`);
            } catch (constraintError) {
              // Constraint might already exist, ignore
            }
          }
        } catch (addError) {
          console.warn(`  ⚠ Could not add column ${table}.${column}: ${addError.message.substring(0, 100)}`);
        }
      }
    }
    
    if (addedColumns > 0) {
      console.log(`\n✓ Added ${addedColumns} missing column(s)`);
    } else {
      console.log(`✓ All required columns exist`);
    }
    
    if (createdTables > 0 || addedColumns > 0) {
      console.log('\n💡 Tip: To disable auto-creation of missing tables/columns, set AUTO_CREATE_MISSING_TABLES=false in your .env file');
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
              'PatientLabTest', 'PatientOTAllocation',
              'PatientAdmitDoctorVisits', 'PatientAdmitVisitVitals', 'PatientICUAdmission',
              'ICUNurseVisitVitals', 'ICUVisitVitals'
            )
        ),
        expected_columns AS (
          SELECT 'PatientLabTest' as table_name, 'RoomAdmissionId' as column_name
          UNION ALL SELECT 'PatientLabTest', 'OrderedByDoctorId'
          UNION ALL SELECT 'PatientOTAllocation', 'RoomAdmissionId'
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

    // Insert default roles if they don't exist
    try {
      console.log('\n=== Inserting default roles ===');

      // Check if SuperAdmin role exists
      const checkSuperAdmin = await pool.query(
        'SELECT "RoleId" FROM "Roles" WHERE "RoleName" = $1',
        ['SuperAdmin']
      );

      if (checkSuperAdmin.rows.length === 0) {
        // Insert SuperAdmin role
        await pool.query(
          'INSERT INTO "Roles" ("RoleName", "RoleDescription") VALUES ($1, $2)',
          ['SuperAdmin', 'Super Administrator role with full access']
        );
        console.log('✓ Inserted SuperAdmin role');
      } else {
        console.log('✓ SuperAdmin role already exists');
      }
    } catch (roleError) {
      console.warn('⚠ Could not insert default roles:', roleError.message);
    }

    // Insert default users if they don't exist
    try {
      console.log('\n=== Inserting default users ===');

      // Get SuperAdmin role ID
      const roleResult = await pool.query(
        'SELECT "RoleId" FROM "Roles" WHERE "RoleName" = $1',
        ['SuperAdmin']
      );

      if (roleResult.rows.length === 0) {
        console.warn('⚠ SuperAdmin role not found, skipping user creation');
      } else {
        const superAdminRoleId = roleResult.rows[0].RoleId;

        // Check if SuperAdmin user exists
        const checkSuperAdminUser = await pool.query(
          'SELECT "UserId" FROM "Users" WHERE "UserName" = $1',
          ['SuperAdmin']
        );

        if (checkSuperAdminUser.rows.length === 0) {
          // Hash the password
          const bcrypt = require('bcrypt');
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash('SuperAdmin', saltRounds);

          // Insert SuperAdmin user
          await pool.query(
            'INSERT INTO "Users" ("RoleId", "UserName", "Password", "Status") VALUES ($1::uuid, $2, $3, $4)',
            [superAdminRoleId, 'SuperAdmin', hashedPassword, 'Active']
          );
          console.log('✓ Inserted SuperAdmin user');
        } else {
          console.log('✓ SuperAdmin user already exists');
        }
      }
    } catch (userError) {
      console.warn('⚠ Could not insert default users:', userError.message);
    }

    // Check which tables exist - verify all 28 required tables
    const baseTablesList = [
      'Roles', 'DoctorDepartment', 'Users', 'PatientRegistration',
      'RoomBeds', 'LabTest', 'ICU', 'BillEntity', 'Bills',
      'EmergencyBed', 'EmergencyBedSlot', 'OT', 'OTSlot',
      'PatientAppointment', 'PatientICUAdmission', 'RoomAdmission',
      'PatientLabTest', 'SurgeryProcedure', 'PatientOTAllocation',
      'PatientOTAllocationSlots', 'EmergencyAdmission', 'EmergencyAdmissionVitals',
      'ICUDoctorVisits', 'ICUVisitVitals',
      'PatientAdmitDoctorVisits', 'PatientAdmitVisitVitals', 'AuditLog'
    ];
    
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
        AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery, [baseTablesList]);
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

