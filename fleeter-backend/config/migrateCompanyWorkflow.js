const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "ALTER TABLE Manager_Profile ALTER COLUMN owner_id DROP NOT NULL",
    );
    await client.query(`
      CREATE TABLE IF NOT EXISTS Company_Request (
        request_id SERIAL PRIMARY KEY,
        requester_user_id INT NOT NULL REFERENCES User_Account(user_id) ON DELETE CASCADE,
        owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
        requested_role VARCHAR(20) NOT NULL CHECK (requested_role IN ('manager', 'driver')),
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        decided_by INT REFERENCES User_Account(user_id) ON DELETE SET NULL,
        decided_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(
      "ALTER TABLE Company_Request DROP CONSTRAINT IF EXISTS company_request_requester_user_id_owner_id_status_key",
    );
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_company_request_one_pending
        ON Company_Request(requester_user_id, status)
        WHERE status = 'pending'
    `);
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_company_request_owner_status ON Company_Request(owner_id, status)",
    );
    await client.query("COMMIT");
    console.log("Company workflow migration completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Company workflow migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
