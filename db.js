const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = {
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : false,
};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
}

if (process.env.PGHOST) poolConfig.host = process.env.PGHOST;
if (process.env.PGPORT) poolConfig.port = process.env.PGPORT;
if (process.env.PGUSER) poolConfig.user = process.env.PGUSER;
if (process.env.PGDATABASE) poolConfig.database = process.env.PGDATABASE;
if (typeof process.env.PGPASSWORD === 'string') {
  poolConfig.password = process.env.PGPASSWORD;
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};

