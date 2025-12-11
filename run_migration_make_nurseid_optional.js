require('dotenv').config();
const { runMigration } = require('./migrations/make_nurseid_optional_in_icu_visit_vitals');

runMigration();

