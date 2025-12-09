require('dotenv').config();
const db = require('./db');

(async () => {
  try {
    // First, check if column exists
    const checkQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'PatientICUAdmission'
      AND column_name = 'OnVentilator';
    `;
    
    const checkResult = await db.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('OnVentilator column NOT found. Running migration...\n');
      
      const fs = require('fs');
      const path = require('path');
      const migrationPath = path.join(__dirname, 'migrations', 'add_on_ventilator_to_patient_icu_admission.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await db.query(migrationSQL);
      console.log('Migration executed successfully!\n');
      
      // Check again
      const verifyResult = await db.query(checkQuery);
      if (verifyResult.rows.length > 0) {
        console.log('SUCCESS: OnVentilator column now exists!');
        console.log('Details:', JSON.stringify(verifyResult.rows[0], null, 2));
      }
    } else {
      console.log('OnVentilator column already exists!');
      console.log('Details:', JSON.stringify(checkResult.rows[0], null, 2));
    }
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
})();
