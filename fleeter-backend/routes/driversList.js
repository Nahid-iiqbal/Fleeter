const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/drivers
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
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
      WHERE $1 = 'admin'
         OR d.owner_id = COALESCE(
           (SELECT owner_id FROM Owner_Profile WHERE user_id = $2),
           (SELECT owner_id FROM Manager_Profile WHERE user_id = $2)
         )
      ORDER BY d.driver_id ASC
    `,
      [req.user.role, req.user.user_id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching drivers:", error);

    res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
});


// GET /api/drivers/:driverId
router.get("/:driverId", verifyToken, async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
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
        WHERE d.driver_id = $1
          AND ($2 = 'admin' OR d.owner_id = COALESCE(
            (SELECT owner_id FROM Owner_Profile WHERE user_id = $3),
            (SELECT owner_id FROM Manager_Profile WHERE user_id = $3)
          ))
      `,
      [driverId, req.user.role, req.user.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching driver:", error);

    res.status(500).json({
      message: "Failed to fetch driver",
    });
  }
});

module.exports = router;