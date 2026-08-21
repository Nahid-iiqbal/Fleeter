const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/drivers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.driver_id,
        d.user_id,
        d.owner_id,
        d.full_name,
        d.phone,
        d.status,
        d.joined_date,
        d.created_at,
        u.username,
        u.email,
        document.document_type,
        document.document_no,
        document.issue_date AS document_issue_date,
        document.expiry_date AS document_expiry_date
      FROM Driver d
      LEFT JOIN User_Account u ON u.user_id = d.user_id
      LEFT JOIN LATERAL (
        SELECT document_type, document_no, issue_date, expiry_date
        FROM Driver_Document
        WHERE driver_id = d.driver_id
        ORDER BY expiry_date DESC, document_id DESC
        LIMIT 1
      ) document ON TRUE
      ORDER BY d.driver_id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching drivers:", error);

    res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
});


// GET /api/drivers/:driverId
router.get("/:driverId", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
        SELECT
          d.driver_id,
          d.user_id,
          d.owner_id,
          d.full_name,
          d.phone,
          d.status,
          d.joined_date,
          d.created_at,
          u.username,
          u.email,
          document.document_type,
          document.document_no,
          document.issue_date AS document_issue_date,
          document.expiry_date AS document_expiry_date
        FROM Driver d
        LEFT JOIN User_Account u ON u.user_id = d.user_id
        LEFT JOIN LATERAL (
          SELECT document_type, document_no, issue_date, expiry_date
          FROM Driver_Document
          WHERE driver_id = d.driver_id
          ORDER BY expiry_date DESC, document_id DESC
          LIMIT 1
        ) document ON TRUE
        WHERE d.driver_id = $1
      `,
      [driverId]
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