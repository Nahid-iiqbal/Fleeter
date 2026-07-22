const path = require('path');
// Explicitly resolve .env path relative to this file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = require('pg');

const pool = new Pool({
  user: String(process.env.DB_USER || 'postgres'),
  host: String(process.env.DB_HOST || 'localhost'),
  database: String(process.env.DB_NAME || 'fleeter_db'),
  password: String(process.env.DB_PASSWORD || ''),
  port: Number(process.env.DB_PORT || 5432),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};