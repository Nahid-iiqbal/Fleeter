const path = require("path");
// Explicitly resolve .env path relative to this file
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = require("pg");

// Check if we are running in production on Render (or if DATABASE_URL is supplied)
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.DATABASE_URL);

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Required for remote cloud Postgres
      },
    }
    : {
      // Fallback for local development
      user: String(process.env.DB_USER || "postgres"),
      host: String(process.env.DB_HOST || "localhost"),
      database: String(process.env.DB_NAME || "fleeter_db"),
      password: String(process.env.DB_PASSWORD || ""),
      port: Number(process.env.DB_PORT || 5432),
    }
);

// Optional: Quick connection test log
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring database client:", err.stack);
  }
  console.log("Connected to PostgreSQL successfully!");
  release();
});

module.exports = pool;
