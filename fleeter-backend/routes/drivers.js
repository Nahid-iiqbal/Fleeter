const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/drivers
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        driver_id,
        full_name,
        license_no,
        license_type,
        license_expiry,
        phone,
        address,
        status,
        joined_date,
        created_at
      FROM Driver
      ORDER BY driver_id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching drivers:", error);

    res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
});

module.exports = router;