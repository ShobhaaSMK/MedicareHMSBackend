require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function run() {
  try {
    console.log('Running migration: reset ICUVisitVitals table');
    const sqlPath = path.join(__dirname, 'migrations', 'reset_icu_visit_vitals.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('✓ Migration completed');
    await db.pool.end();
    process.exit(0);
  } catch (err) {
    console.error('✗ Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };

