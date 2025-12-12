require('dotenv').config();
const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running migration: Add VitalsStatus to PatientAdmitVisitVitals...\n');
  
  try {
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, 'migrations', 'add_vitalsstatus_to_patient_admit_visit_vitals.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`✗ Migration file not found: ${sqlFilePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    if (!sql || sql.trim().length === 0) {
      console.error('✗ Migration file is empty');
      process.exit(1);
    }

    // Execute the migration
    console.log('Executing migration SQL...');
    await db.query(sql);
    console.log('✓ Migration executed successfully\n');

    // Verify the column was added
    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'PatientAdmitVisitVitals' 
      AND column_name = 'VitalsStatus';
    `;
    
    const { rows } = await db.query(checkQuery);
    
    if (rows.length > 0) {
      console.log('✓ Verification: VitalsStatus column exists');
      console.log(`  Data Type: ${rows[0].data_type}`);
      console.log(`  Nullable: ${rows[0].is_nullable}`);
    } else {
      console.log('⚠ Warning: Could not verify VitalsStatus column exists');
    }

    // Check for index
    const indexQuery = `
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'PatientAdmitVisitVitals' 
      AND indexname = 'idx_patientadmitvisitvitals_vitalsstatus';
    `;
    
    const indexResult = await db.query(indexQuery);
    if (indexResult.rows.length > 0) {
      console.log('✓ Verification: Index on VitalsStatus exists');
    }

    await db.pool.end();
    console.log('\nMigration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error running migration:', error.message);
    console.error('Error details:', error);
    await db.pool.end();
    process.exit(1);
  }
}

runMigration();

