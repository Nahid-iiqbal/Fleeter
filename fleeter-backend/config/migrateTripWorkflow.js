const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const pool = require("./db");

const migrateTripWorkflow = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("ALTER TABLE Trip DROP COLUMN IF EXISTS start_odometer");
    await client.query("ALTER TABLE Trip DROP COLUMN IF EXISTS end_odometer");
    await client.query("ALTER TABLE Trip ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(20)");
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'trip' AND column_name = 'cargo_or_passengers'
        ) THEN
          UPDATE Trip
          SET cargo_type = CASE WHEN LOWER(cargo_or_passengers) LIKE '%passenger%' THEN 'passengers' ELSE 'cargo' END
          WHERE cargo_type IS NULL AND cargo_or_passengers IS NOT NULL;
        END IF;
      END $$;
    `);
    await client.query("ALTER TABLE Trip DROP COLUMN IF EXISTS cargo_or_passengers");
    await client.query("ALTER TABLE Trip DROP CONSTRAINT IF EXISTS trip_cargo_type_check");
    await client.query("ALTER TABLE Trip ADD CONSTRAINT trip_cargo_type_check CHECK (cargo_type IN ('cargo', 'passengers'))");
    await client.query("COMMIT");
    console.log("Trip workflow migration completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Trip workflow migration failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

migrateTripWorkflow();
