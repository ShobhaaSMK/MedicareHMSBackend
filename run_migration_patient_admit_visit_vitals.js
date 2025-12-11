require('dotenv').config();
const { runMigration } = require('./migrations/add_fields_to_patient_admit_visit_vitals');

runMigration();

