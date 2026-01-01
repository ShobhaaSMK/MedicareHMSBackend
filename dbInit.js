const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Initialize database - create if it doesn't exist
 */
async function initializeDatabase() {
  const dbName = process.env.PGDATABASE;
  const dbHost = process.env.PGHOST || '127.0.0.1';
  const dbPort = process.env.PGPORT || 5432;
  const dbUser = process.env.PGUSER || 'root';
  const dbPassword = process.env.PGPASSWORD || 'root';

  let parsedConfig = {};
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      parsedConfig = {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error.message);
    }
  }

  const config = {
    host: parsedConfig.host || dbHost,
    port: parsedConfig.port || dbPort,
    user: parsedConfig.user || dbUser,
    password: parsedConfig.password || dbPassword,
  };

  const targetDbName = parsedConfig.database || dbName;

  if (!targetDbName) {
    return {
      success: false,
      message: 'Database name not specified in environment variables (PGDATABASE or DATABASE_URL)',
      created: false,
    };
  }

  const adminPool = new Pool({
    ...config,
    database: 'postgres',
  });

  try {
    console.log(`\n🔍 Checking if database '${targetDbName}' exists...`);
    
    const checkResult = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [targetDbName]
    );

    if (checkResult.rows.length > 0) {
      console.log(`✅ Database '${targetDbName}' already exists`);
      await adminPool.end();
      return {
        success: true,
        message: `Database '${targetDbName}' already exists`,
        created: false,
      };
    }

    console.log(`📝 Database '${targetDbName}' not found. Creating...`);
    const sanitizedDbName = targetDbName.replace(/"/g, '""');
    await adminPool.query(`CREATE DATABASE "${sanitizedDbName}"`);

    console.log(`✅ Database '${targetDbName}' created successfully`);
    await adminPool.end();

    return {
      success: true,
      message: `Database '${targetDbName}' created successfully`,
      created: true,
    };
  } catch (error) {
    console.error(`❌ Error creating database '${targetDbName}':`, error.message);
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
 * Initialize tables by executing init_tables.sql statement by statement
 */
async function initializeTables() {
  const dbName = process.env.PGDATABASE;
  const dbHost = process.env.PGHOST || '127.0.0.1';
  const dbPort = process.env.PGPORT || 5432;
  const dbUser = process.env.PGUSER || 'root';
  const dbPassword = process.env.PGPASSWORD || 'root';

  let parsedConfig = {};
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      parsedConfig = {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error.message);
    }
  }

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
      message: 'Database name not specified',
      tablesCreated: 0,
    };
  }

  console.log(`\n=== Initializing Tables ===`);
  console.log(`📊 Database: ${config.database}`);
  console.log(`🔌 Host: ${config.host}:${config.port}`);
  console.log(`👤 User: ${config.user}`);

  const pool = new Pool(config);

  try {
    // Test connection
    console.log('\n=== Testing Connection ===');
    const connTest = await pool.query('SELECT current_database(), current_user');
    console.log(`✅ Connected to: ${connTest.rows[0].current_database}`);
    console.log(`✅ User: ${connTest.rows[0].current_user}`);

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'init_tables.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`\n📄 Read SQL file: ${(sqlContent.length / 1024).toFixed(2)} KB`);

    // Extract table names for tracking
    const tablePattern = /CREATE TABLE IF NOT EXISTS (?:public\.)?"(\w+)"/gi;
    const expectedTables = [];
    let match;
    while ((match = tablePattern.exec(sqlContent)) !== null) {
      expectedTables.push(match[1]);
    }
    console.log(`📋 Found ${expectedTables.length} table definitions: ${expectedTables.slice(0, 5).join(', ')}${expectedTables.length > 5 ? '...' : ''}`);

    // Check existing tables
    const beforeCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = ANY($1::text[])
    `, [expectedTables]);
    const existingBefore = beforeCheck.rows.map(r => r.table_name);
    console.log(`\n📊 Tables before execution: ${existingBefore.length}`);
    if (existingBefore.length > 0) {
      console.log(`   Existing: ${existingBefore.slice(0, 5).join(', ')}${existingBefore.length > 5 ? ` ... and ${existingBefore.length - 5} more` : ''}`);
    }

    // Execute the SQL file directly (PostgreSQL handles multiple statements natively)
    console.log('\n=== Executing init_tables.sql ===');
    console.log(`📝 Creating tables, indexes, and constraints...`);
    const startTime = Date.now();
    
    try {
      await pool.query(sqlContent);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ SQL script executed successfully (took ${duration}s)`);
    } catch (sqlError) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      // Check if it's a non-critical error
      const errorMsg = sqlError.message.toLowerCase();
      const isNonCritical = 
        errorMsg.includes('already exists') ||
        errorMsg.includes('duplicate') ||
        (errorMsg.includes('constraint') && errorMsg.includes('already')) ||
        (errorMsg.includes('relation') && errorMsg.includes('already'));

      if (isNonCritical) {
        console.log(`⚠️  Non-critical SQL warning: ${sqlError.message.substring(0, 150)}`);
        console.log(`✅ SQL script executed with warnings (took ${duration}s)`);
      } else {
        console.error(`\n❌ SQL Execution Error (took ${duration}s):`);
        console.error(`   Error: ${sqlError.message}`);
        if (sqlError.code) {
          console.error(`   Code: ${sqlError.code}`);
        }
        if (sqlError.position) {
          console.error(`   Position: ${sqlError.position}`);
          // Show context around error
          const startPos = Math.max(0, sqlError.position - 100);
          const endPos = Math.min(sqlContent.length, sqlError.position + 100);
          const errorContext = sqlContent.substring(startPos, endPos);
          console.error(`   Context: ...${errorContext}...`);
        }
        if (sqlError.detail) {
          console.error(`   Detail: ${sqlError.detail}`);
        }
        if (sqlError.hint) {
          console.error(`   Hint: ${sqlError.hint}`);
        }
        
        // Try to identify the problematic table
        const relationMatch = sqlError.message.match(/relation "(\w+)" does not exist/i);
        if (relationMatch) {
          const missingTable = relationMatch[1];
          console.error(`\n   🔍 Analysis:`);
          console.error(`   The table "${missingTable}" is being referenced but doesn't exist yet.`);
          console.error(`   This is likely a table creation order issue in init_tables.sql.`);
        }
        
        throw sqlError;
      }
    }
    
    // Check final table count
    console.log('\n=== Verifying Tables ===');
    const afterCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name = ANY($1::text[])
      ORDER BY table_name
    `, [expectedTables]);
    const existingAfter = afterCheck.rows.map(r => r.table_name);
    const newlyCreated = existingAfter.filter(t => !existingBefore.includes(t));

    console.log(`📊 Tables after execution: ${existingAfter.length} out of ${expectedTables.length} expected`);
    if (newlyCreated.length > 0) {
      console.log(`✨ Newly created: ${newlyCreated.length} table(s)`);
      newlyCreated.forEach(t => console.log(`   ✓ ${t}`));
    } else if (existingAfter.length === expectedTables.length) {
      console.log(`   ℹ️  All tables already existed (using IF NOT EXISTS)`);
    }

    if (existingAfter.length < expectedTables.length) {
      const missing = expectedTables.filter(t => !existingAfter.includes(t));
      console.warn(`\n⚠️  Missing tables: ${missing.length}`);
      missing.forEach(t => console.warn(`   - ${t}`));
    } else {
      console.log(`✅ All ${expectedTables.length} expected tables are present`);
    }

    // Insert default data
    console.log('\n=== Inserting Default Data ===');
    
    // Insert SuperAdmin role
    try {
      const roleCheck = await pool.query('SELECT "RoleId" FROM "Roles" WHERE "RoleName" = $1', ['SuperAdmin']);
      if (roleCheck.rows.length === 0) {
        await pool.query(
          'INSERT INTO "Roles" ("RoleName", "RoleDescription") VALUES ($1, $2)',
          ['SuperAdmin', 'Super Administrator role with full access']
        );
        console.log('✅ Inserted SuperAdmin role');
      } else {
        console.log('✓ SuperAdmin role already exists');
      }
    } catch (roleError) {
      console.warn(`⚠ Could not insert SuperAdmin role: ${roleError.message}`);
    }

    // Insert SuperAdmin user
    try {
      const roleResult = await pool.query('SELECT "RoleId" FROM "Roles" WHERE "RoleName" = $1', ['SuperAdmin']);
      if (roleResult.rows.length > 0) {
        const superAdminRoleId = roleResult.rows[0].RoleId;
        const userCheck = await pool.query('SELECT "UserId" FROM "Users" WHERE "UserName" = $1', ['SuperAdmin']);
        
        if (userCheck.rows.length === 0) {
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash('SuperAdmin', 10);
          await pool.query(
            'INSERT INTO "Users" ("RoleId", "UserName", "Password", "Status") VALUES ($1::uuid, $2, $3, $4)',
            [superAdminRoleId, 'SuperAdmin', hashedPassword, 'Active']
          );
          console.log('✅ Inserted SuperAdmin user');
        } else {
          console.log('✓ SuperAdmin user already exists');
        }
      }
    } catch (userError) {
      console.warn(`⚠ Could not insert SuperAdmin user: ${userError.message}`);
    }

    // Final summary
    console.log('\n=== Final Summary ===');
    console.log(`✅ Database: ${config.database}`);
    console.log(`✅ Tables: ${existingAfter.length} out of ${expectedTables.length}`);

    await pool.end();

    return {
      success: existingAfter.length > 0,
      message: `Initialized ${existingAfter.length} tables`,
      tablesCreated: existingAfter.length,
      tables: existingAfter
    };
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    await pool.end();
    return {
      success: false,
      message: `Error: ${error.message}`,
      tablesCreated: 0,
      error: error.message,
    };
  }
}

/**
 * Initialize both database and tables
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

// If run directly, execute initialization
if (require.main === module) {
  initializeDatabaseAndTables()
    .then(({ dbResult, tablesResult }) => {
      console.log('\n=== Complete ===');
      if (dbResult.success && tablesResult.success) {
        console.log('✅ Database initialization completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Initialization completed with errors');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}
