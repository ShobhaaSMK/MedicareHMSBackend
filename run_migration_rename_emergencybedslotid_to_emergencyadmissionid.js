require('dotenv').config();
const { Pool } = require('pg');

// Database configuration
const poolConfig = {
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  if (process.env.PGHOST) poolConfig.host = process.env.PGHOST;
  if (process.env.PGPORT) poolConfig.port = process.env.PGPORT;
  if (process.env.PGUSER) poolConfig.user = process.env.PGUSER;
  if (process.env.PGDATABASE) poolConfig.database = process.env.PGDATABASE;
  if (typeof process.env.PGPASSWORD === 'string') {
    poolConfig.password = process.env.PGPASSWORD;
  }
}

const pool = new Pool(poolConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting migration: Rename EmergencyBedSlotId to EmergencyAdmissionId in PatientLabTest table...');
    
    // Check if EmergencyBedSlotId column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'PatientLabTest' 
      AND column_name = 'EmergencyBedSlotId'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('EmergencyBedSlotId column does not exist. Checking if EmergencyAdmissionId already exists...');
      
      const newColumnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND column_name = 'EmergencyAdmissionId'
      `);
      
      if (newColumnCheck.rows.length > 0) {
        console.log('EmergencyAdmissionId column already exists. Migration may have already been run.');
        await client.query('COMMIT');
        return;
      } else {
        console.log('Neither column exists. This is unexpected. Aborting migration.');
        await client.query('ROLLBACK');
        return;
      }
    }
    
    // Check if EmergencyAdmissionId column already exists
    const newColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'PatientLabTest' 
      AND column_name = 'EmergencyAdmissionId'
    `);
    
    if (newColumnCheck.rows.length > 0) {
      console.log('EmergencyAdmissionId column already exists. Dropping old EmergencyBedSlotId column...');
      
      // Drop the old foreign key constraint if it exists
      const fkCheck = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND constraint_name = 'PatientLabTest_EmergencyBedSlotId_fkey'
      `);
      
      if (fkCheck.rows.length > 0) {
        console.log('Dropping old foreign key constraint: PatientLabTest_EmergencyBedSlotId_fkey');
        await client.query(`
          ALTER TABLE "PatientLabTest" 
          DROP CONSTRAINT IF EXISTS "PatientLabTest_EmergencyBedSlotId_fkey"
        `);
      }
      
      // Drop the old column
      await client.query(`
        ALTER TABLE "PatientLabTest" 
        DROP COLUMN IF EXISTS "EmergencyBedSlotId"
      `);
      
      console.log('✓ Dropped EmergencyBedSlotId column');
    } else {
      // Drop the old foreign key constraint if it exists
      const fkCheck = await client.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'PatientLabTest' 
        AND constraint_name = 'PatientLabTest_EmergencyBedSlotId_fkey'
      `);
      
      if (fkCheck.rows.length > 0) {
        console.log('Dropping old foreign key constraint: PatientLabTest_EmergencyBedSlotId_fkey');
        await client.query(`
          ALTER TABLE "PatientLabTest" 
          DROP CONSTRAINT IF EXISTS "PatientLabTest_EmergencyBedSlotId_fkey"
        `);
      }
      
      // Rename the column
      console.log('Renaming EmergencyBedSlotId to EmergencyAdmissionId...');
      await client.query(`
        ALTER TABLE "PatientLabTest" 
        RENAME COLUMN "EmergencyBedSlotId" TO "EmergencyAdmissionId"
      `);
      
      console.log('✓ Renamed column from EmergencyBedSlotId to EmergencyAdmissionId');
      
      // Add new foreign key constraint
      console.log('Adding new foreign key constraint to EmergencyAdmission table...');
      await client.query(`
        ALTER TABLE "PatientLabTest" 
        ADD CONSTRAINT "PatientLabTest_EmergencyAdmissionId_fkey" 
        FOREIGN KEY ("EmergencyAdmissionId") 
        REFERENCES "EmergencyAdmission"("EmergencyAdmissionId") 
        ON DELETE SET NULL
      `);
      
      console.log('✓ Added foreign key constraint to EmergencyAdmission table');
    }
    
    // Create index if it doesn't exist
    const indexCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'PatientLabTest' 
      AND indexname = 'idx_patientlabtest_emergencyadmissionid'
    `);
    
    if (indexCheck.rows.length === 0) {
      console.log('Creating index on EmergencyAdmissionId...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_patientlabtest_emergencyadmissionid 
        ON "PatientLabTest"("EmergencyAdmissionId")
      `);
      console.log('✓ Created index on EmergencyAdmissionId');
    } else {
      console.log('Index on EmergencyAdmissionId already exists');
    }
    
    await client.query('COMMIT');
    console.log('\n✓ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

