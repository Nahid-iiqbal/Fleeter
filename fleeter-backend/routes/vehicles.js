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
        v.last_service_date,
        v.condition_status,
        v.availability_status,
        assignment.driver_id AS current_driver_id,
        assignment.driver_name AS current_driver_name
      FROM Vehicle v
      LEFT JOIN LATERAL (
        SELECT t.driver_id, d.full_name AS driver_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE t.vehicle_id = v.vehicle_id
          AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC, t.trip_id DESC
        LIMIT 1
      ) assignment ON TRUE
      ORDER BY v.vehicle_id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vehicles:", error);

    res.status(500).json({
      message: "Failed to fetch vehicles",
    });
  }
});


// GET /api/vehicles/:vehicleId
router.get("/:vehicleId", authMiddleware, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await pool.query(
      `
      SELECT
        v.vehicle_id,
        v.registration_no,
        v.type,
        v.brand,
        v.model,
        v.year,
        v.capacity,
        v.fuel_type,
        v.last_service_date,
        v.condition_status,
        v.availability_status,
        assignment.driver_id AS current_driver_id,
        assignment.driver_name
      FROM Vehicle v
      LEFT JOIN LATERAL (
        SELECT t.driver_id, d.full_name AS driver_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE t.vehicle_id = v.vehicle_id
          AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC, t.trip_id DESC
        LIMIT 1
      ) assignment ON TRUE
      WHERE v.vehicle_id = $1
      `,
      [vehicleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vehicle:", error);

    res.status(500).json({
      message: "Failed to fetch vehicle",
    });
  }
});

module.exports = router;