require('dotenv').config();
const db = require('./db');
const fs = require('fs');

const sql = fs.readFileSync('./migrations/add_on_ventilator_to_patient_icu_admission.sql', 'utf8');

db.query(sql)
  .then(() => {
    console.log('✓ Migration executed successfully!');
    return db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'PatientICUAdmission' 
      AND column_name = 'OnVentilator'
    `);
  })
  .then((result) => {
    if (result.rows.length > 0) {
      console.log('✓ OnVentilator column exists in database');
      console.log('  Column:', result.rows[0].column_name);
      console.log('  Type:', result.rows[0].data_type);
      console.log('  Default:', result.rows[0].column_default);
    } else {
      console.log('✗ Column not found after migration');
    }
    return db.pool.end();
  })
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Error:', error.message);
    db.pool.end().catch(() => {});
    process.exit(1);
  });
