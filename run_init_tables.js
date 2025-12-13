require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function checkColumnExists(client, tableName, columnName) {
  const result = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1 
    AND column_name = $2
  `, [tableName, columnName]);
  return result.rows.length > 0;
}

async function addMissingColumns(client) {
  console.log('Checking for missing columns in existing tables...\n');
  
  const missingColumns = [
    { table: 'PatientAdmitVisitVitals', column: 'NurseId', definition: '"NurseId" INTEGER' },
    { table: 'PatientAdmitVisitVitals', column: 'PatientStatus', definition: '"PatientStatus" VARCHAR(50) CHECK ("PatientStatus" IN (\'Stable\', \'Notstable\'))' },
    { table: 'PatientAdmitVisitVitals', column: 'VisitRemarks', definition: '"VisitRemarks" TEXT' },
  ];
  
  for (const { table, column, definition } of missingColumns) {
    const exists = await checkColumnExists(client, table, column);
    if (!exists) {
      try {
        await client.query(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
        console.log(`  ✓ Added column ${column} to ${table}`);
      } catch (err) {
        console.log(`  ⚠ Could not add column ${column} to ${table}: ${err.message}`);
      }
    }
  }
  
  console.log('');
}

async function run() {
  const client = await db.pool.connect();
  try {
    console.log('========================================');
    console.log('Running init_tables.sql on database:', process.env.PGDATABASE || 'medicarehms');
    console.log('========================================\n');
    
    const sqlPath = path.join(__dirname, 'init_tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`✗ SQL file not found: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      console.error('✗ SQL file is empty');
      process.exit(1);
    }

    // First, add missing columns to existing tables
    await client.query('BEGIN');
    await addMissingColumns(client);
    await client.query('COMMIT');
    
    console.log('Executing SQL script...\n');
    
    await client.query('BEGIN');
    
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✓ SQL script executed successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      
      const errorMsg = err.message.toLowerCase();
      console.error(`\n✗ Error: ${err.message}`);
      
      if (err.detail) {
        console.error(`   Detail: ${err.detail}`);
      }
      
      // If it's a column error, try to provide more context
      if (errorMsg.includes('column') && errorMsg.includes('does not exist')) {
        console.error('\n   This error typically occurs when:');
        console.error('   - A table exists but is missing required columns');
        console.error('   - A foreign key references a column that doesn\'t exist');
        console.error('\n   You may need to manually add missing columns or update table structures.');
      }
      
      throw err;
    }
    
    // Check which tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`\n✓ Found ${existingTables.length} tables in the database:`);
    existingTables.forEach(table => console.log(`  - ${table}`));
    
    client.release();
    await db.pool.end();
    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Ignore rollback errors
    }
    client.release();
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };
