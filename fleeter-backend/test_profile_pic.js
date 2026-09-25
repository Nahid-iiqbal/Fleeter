const pool = require("./config/db");
pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='driver' AND column_name='profile_picture_url') THEN
          ALTER TABLE Driver ADD COLUMN profile_picture_url TEXT;
        END IF;
      END
      $$;
`).then(() => console.log("Success")).catch(console.error).finally(() => process.exit(0));
