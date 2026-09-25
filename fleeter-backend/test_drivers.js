const pool = require("./config/db");
pool.query(`
      SELECT
        d.driver_id,
        d.full_name,
        d.phone,
        d.status,
        d.joined_date,
        d.created_at,
        u.username,
        u.email,
        document.document_no,
        document.document_type,
        document.document_no AS license_no,
        document.document_type AS license_type,
        document.expiry_date AS license_expiry
      FROM Driver d
      LEFT JOIN User_Account u ON u.user_id = d.user_id
      LEFT JOIN LATERAL (
        SELECT document_no, document_type, expiry_date
        FROM Driver_Document
        WHERE driver_id = d.driver_id
        ORDER BY expiry_date DESC
        LIMIT 1
      ) document ON TRUE
      WHERE 'owner' = 'admin'
         OR d.owner_id = COALESCE(
           (SELECT owner_id FROM Owner_Profile WHERE user_id = 33),
           (SELECT owner_id FROM Manager_Profile WHERE user_id = 33)
         )
      ORDER BY d.driver_id ASC
`).then(r => console.table(r.rows)).catch(console.error).finally(() => process.exit(0));
