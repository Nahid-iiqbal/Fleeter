const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/vehicles
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.vehicle_id,
        v.registration_no,
        v.type,
        v.brand,
        v.model,
        v.year,
        v.capacity,
        v.fuel_type,
        v.status,
        v.last_service_date,
        v.current_driver_id,
        d.full_name AS current_driver_name,
        v.created_at
      FROM Vehicle v
      LEFT JOIN Driver d
        ON v.current_driver_id = d.driver_id
      ORDER BY v.vehicle_id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vehicles:", error);

    res.status(500).json({
      message: "Failed to fetch vehicles",
    });
  }
});

module.exports = router;