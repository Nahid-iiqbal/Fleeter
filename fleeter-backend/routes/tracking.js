const router = require('express').Router();
const db = require('../config/db');
const { verifyTokenAndRole } = require('../middleware/auth');

// 1. Get Live Locations for Owner Dashboard
router.get('/live', verifyTokenAndRole(['owner', 'admin']), async (req, res) => {
  try {
    // DISTINCT ON ensures we only get one row per vehicle_id
    // ORDER BY ping_time DESC guarantees that row is the most recent one
    const queryText = `
      SELECT DISTINCT ON (t.vehicle_id)
        t.vehicle_id,
        v.registration_no,
        ST_Y(t.geom::geometry) AS latitude,
        ST_X(t.geom::geometry) AS longitude,
        t.speed_kmh,
        t.ping_time AS last_updated
      FROM Vehicle_Telemetry t
      JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
      ORDER BY t.vehicle_id, t.ping_time DESC;
    `;
    const { rows } = await db.query(queryText);
    res.json(rows);
  } catch (err) {
    console.error("Live Tracking Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Post Location Ping from Driver App
router.post('/ping', verifyTokenAndRole(['driver']), async (req, res) => {
  const {
    vehicle_id,
    trip_id,
    latitude,
    longitude,
    speed_kmh,
    altitude,
    battery_level
  } = req.body;

  try {
    // Save directly to historical telemetry using PostGIS syntax
    await db.query(
      `INSERT INTO Vehicle_Telemetry
        (vehicle_id, trip_id, geom, speed_kmh, altitude, battery_level, ping_time)
       VALUES
        ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, NOW())`,
      [
        vehicle_id,
        trip_id || null,
        longitude, // Longitude must be first for ST_MakePoint
        latitude,
        speed_kmh || 0.00,
        altitude || null,
        battery_level || null
      ]
    );

    res.json({ message: 'Ping recorded successfully' });
  } catch (err) {
    console.error("Telemetry Ping Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
