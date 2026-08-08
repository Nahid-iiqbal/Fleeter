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


// GET /api/drivers/:driverId
router.get("/:driverId", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.params;

    const result = await pool.query(
      `
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
        WHERE driver_id = $1
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