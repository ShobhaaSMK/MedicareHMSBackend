require('dotenv').config();
const db = require('./db');

async function verifyColumn() {
  try {
    console.log('Checking if OnVentilator column exists...\n');
    
    const query = `
      SELECT 
        column_name, 
        data_type, 
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND column_name = 'OnVentilator';
    `;
    
    const result = await db.query(query);
    
    if (result.rows.length > 0) {
      console.log('✓ OnVentilator column EXISTS in PatientICUAdmission table');
      console.log('\nColumn details:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('✗ OnVentilator column NOT FOUND in PatientICUAdmission table');
      console.log('\nRunning migration now...\n');
      
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, 'migrations', 'add_on_ventilator_to_patient_icu_admission.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await db.query(migrationSQL);
      console.log('✓ Migration executed successfully!');
      
      // Verify again
      const verifyResult = await db.query(query);
      if (verifyResult.rows.length > 0) {
        console.log('\n✓ Verification: Column now exists');
        console.log('Column details:', JSON.stringify(verifyResult.rows[0], null, 2));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

verifyColumn();
