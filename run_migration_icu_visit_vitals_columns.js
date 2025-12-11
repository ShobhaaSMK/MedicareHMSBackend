require('dotenv').config();
const { runMigration } = require('./migrations/add_missing_columns_to_icu_visit_vitals');

runMigration();

