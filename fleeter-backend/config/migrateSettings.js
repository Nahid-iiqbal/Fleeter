const pool = require("./db");

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Starting settings migration...");
    await client.query("BEGIN");

    // Add theme column
    await client.query(`
      ALTER TABLE User_Account
      ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light';
    `);
    console.log("Added theme column.");

    // Add notifications_enabled column
    await client.query(`
      ALTER TABLE User_Account
      ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
    `);
    console.log("Added notifications_enabled column.");

    await client.query("COMMIT");
    console.log("Migration completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
