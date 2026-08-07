const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Adjust path if your db.js is elsewhere
const auth = require("../middleware/authMiddleware");

// GET /api/dashboard/stats
// Protected by the 'auth' middleware
router.get("/stats", auth, async (req, res) => {
  try {
    // We use Promise.all to run these queries at the exact same time for speed
    const [vehicles, drivers, incidents] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM Vehicle"),
      pool.query("SELECT COUNT(*) FROM Driver WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM Incident WHERE resolved = FALSE"),
    ]);

    res.json({
      totalVehicles: parseInt(vehicles.rows[0].count),
      activeDrivers: parseInt(drivers.rows[0].count),
      alerts: parseInt(incidents.rows[0].count),
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
