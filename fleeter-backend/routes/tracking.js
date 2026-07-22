const router = require('express').Router();
const db = require('../config/db');
const { verifyTokenAndRole } = require('../middleware/auth');

// 1. Get Live Locations for Owner Dashboard
router.get('/live', verifyTokenAndRole(['owner', 'admin']), async (req, res) => {
  try {
    const queryText = `
      SELECT l.vehicle_id, v.registration_no, v.type, l.latitude, l.longitude, l.speed_kmh, l.status, l.last_updated
      FROM Live_Tracking_Status l
      JOIN Vehicle v ON l.vehicle_id = v.vehicle_id;
    `;
    const { rows } = await db.query(queryText);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Post Location Ping from Driver App
router.post('/ping', verifyTokenAndRole(['driver']), async (req, res) => {
  const { vehicle_id, latitude, longitude, speed_kmh } = req.body;

  try {
    // Save to historical telemetry
    await db.query(
      `INSERT INTO Vehicle_Telemetry (vehicle_id, latitude, longitude, speed_kmh) VALUES ($1, $2, $3, $4)`,
      [vehicle_id, latitude, longitude, speed_kmh]
    );

    // Upsert into Live Tracking Status
    await db.query(
      `INSERT INTO Live_Tracking_Status (vehicle_id, latitude, longitude, speed_kmh, status, last_updated)
       VALUES ($1, $2, $3, $4, 'moving', NOW())
       ON CONFLICT (vehicle_id) DO UPDATE 
       SET latitude = $2, longitude = $3, speed_kmh = $4, status = 'moving', last_updated = NOW()`,
      [vehicle_id, latitude, longitude, speed_kmh]
    );

    res.json({ message: 'Ping recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;