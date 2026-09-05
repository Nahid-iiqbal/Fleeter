const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

// POST /api/tracking/ping (Driver sends their live location)
router.post("/ping", authorizeRole("driver"), async (req, res) => {
  const { vehicle_id, trip_id, longitude, latitude, speed_kmh, battery_level } =
    req.body;

  if (!vehicle_id || longitude == null || latitude == null) {
    return res
      .status(400)
      .json({ message: "Vehicle ID, longitude, and latitude are required." });
  }

  try {
    // Secure PostGIS insertion using ST_SetSRID and ST_MakePoint
    await pool.query(
      `
            INSERT INTO Vehicle_Telemetry (vehicle_id, trip_id, geom, speed_kmh, battery_level, ping_time)
            VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, NOW())
        `,
      [
        vehicle_id,
        trip_id || null,
        longitude,
        latitude,
        speed_kmh || 0,
        battery_level || null,
      ],
    );

    res.status(201).json({ message: "Location ping recorded." });
  } catch (error) {
    res.status(500).json({ message: "Failed to record telemetry." });
  }
});

// GET /api/tracking/fleet (Owners/Managers view their live fleet)
router.get("/fleet", authorizeRole("owner", "manager"), async (req, res) => {
  try {
    // Fetch the latest ping for all vehicles owned by this user
    const query = `
            SELECT DISTINCT ON (vt.vehicle_id)
                vt.vehicle_id, v.registration_no,
                assignment.driver_id, assignment.driver_name,
                ST_X(vt.geom) as longitude, ST_Y(vt.geom) as latitude,
                vt.speed_kmh, vt.ping_time
            FROM Vehicle_Telemetry vt
            JOIN Vehicle v ON vt.vehicle_id = v.vehicle_id
            LEFT JOIN LATERAL (
              SELECT t.driver_id, d.full_name AS driver_name
              FROM Trip t
              JOIN Driver d ON d.driver_id = t.driver_id
              WHERE t.vehicle_id = v.vehicle_id AND t.status = 'in_progress'
              ORDER BY t.departure_time DESC, t.trip_id DESC
              LIMIT 1
            ) assignment ON TRUE
            WHERE v.owner_id = COALESCE(
              (SELECT owner_id FROM Owner_Profile WHERE user_id = $1),
              (SELECT owner_id FROM Manager_Profile WHERE user_id = $1)
            )
            ORDER BY vt.vehicle_id, vt.ping_time DESC;
        `;

    const result = await pool.query(query, [req.user.user_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fleet locations." });
  }
});

module.exports = router;
