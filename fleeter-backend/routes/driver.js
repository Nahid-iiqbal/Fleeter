const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/authMiddleware");

// GET /api/driver/active-trip
router.get("/active-trip", auth, async (req, res) => {
  try {
    // 1. Get the driver_id associated with the currently logged-in user
    const driverQuery = await pool.query(
      "SELECT driver_id, full_name FROM Driver WHERE user_id = $1",
      [req.user.user_id], // Pulled securely from the JWT token via auth middleware
    );

    if (driverQuery.rows.length === 0) {
      return res.status(404).json({ error: "Driver profile not found." });
    }

    const driverId = driverQuery.rows[0].driver_id;
    const driverName = driverQuery.rows[0].full_name;

    // 2. Query for their current or next trip
    // Using COALESCE to grab the address from the Route table if it exists, otherwise use the manual text address
    const tripQuery = await pool.query(
      `
      SELECT 
        t.trip_id,
        t.vehicle_id, 
        t.status, 
        COALESCE(r.origin, t.origin_address) AS origin, 
        COALESCE(r.destination, t.destination_address) AS destination,
        v.registration_no
      FROM Trip t
      LEFT JOIN Route r ON t.route_id = r.route_id
      JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
      WHERE t.driver_id = $1 AND t.status IN ('scheduled', 'in_progress')
      ORDER BY t.departure_time ASC
      LIMIT 1
    `,
      [driverId],
    );

    // 3. Send the data back to the dashboard
    res.json({
      name: driverName,
      activeTrip: tripQuery.rows.length > 0 ? tripQuery.rows[0] : null,
    });
  } catch (err) {
    console.error("Error fetching driver dashboard data:", err);
    res.status(500).json({ error: "Failed to fetch driver data." });
  }
});
// POST /api/driver/log-fuel
router.post("/log-fuel", auth, async (req, res) => {
  const {
    vehicle_id,
    trip_id,
    liters,
    cost_per_liter,
    total_cost,
    odometer_km,
    station_name,
  } = req.body;
  try {
    await pool.query(
      `
      INSERT INTO Fuel_Log (vehicle_id, trip_id, logged_by, refuel_time, liters, cost_per_liter, total_cost, odometer_km, station_name)
      VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8)
    `,
      [
        vehicle_id,
        trip_id,
        req.user.user_id,
        liters,
        cost_per_liter,
        total_cost,
        odometer_km,
        station_name,
      ],
    );

    res.status(201).json({ message: "Fuel logged successfully" });
  } catch (error) {
    console.error("Error inserting fuel log:", error);
    res.status(500).json({ error: "Database error while logging fuel." });
  }
});

// POST /api/driver/log-incident
router.post("/log-incident", auth, async (req, res) => {
  const { trip_id, type, severity, description, reported_to } = req.body;

  if (!trip_id) {
    return res
      .status(400)
      .json({ error: "An active trip is required to report an incident." });
  }

  try {
    await pool.query(
      `
      INSERT INTO Incident (trip_id, incident_date, type, description, severity, reported_to, logged_by)
      VALUES ($1, NOW(), $2, $3, $4, $5, $6)
    `,
      [trip_id, type, description, severity, reported_to, req.user.user_id],
    );

    res.status(201).json({ message: "Incident reported successfully" });
  } catch (error) {
    console.error("Error inserting incident:", error);
    res.status(500).json({ error: "Database error while reporting incident." });
  }
});
module.exports = router;
