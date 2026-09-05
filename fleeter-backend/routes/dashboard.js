const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
// GET /api/dashboard/stats
// Protected by the 'auth' middleware
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const companyIdQuery = await pool.query(
      `
        SELECT owner_id FROM Owner_Profile WHERE user_id = $1
        UNION
        SELECT owner_id FROM Manager_Profile WHERE user_id = $1 AND owner_id IS NOT NULL
      `,
      [req.user.user_id],
    );
    const companyId = companyIdQuery.rows[0]?.owner_id;
    if (!companyId) {
      return res.json({ totalVehicles: 0, activeDrivers: 0, alerts: 0 });
    }

    // We use Promise.all to run these queries at the exact same time for speed
    const [vehicles, drivers, incidents] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM Vehicle WHERE owner_id = $1", [companyId]),
      pool.query("SELECT COUNT(*) FROM Driver WHERE owner_id = $1 AND status = 'active'", [companyId]),
      pool.query(
        "SELECT COUNT(*) FROM Incident i JOIN Trip t ON t.trip_id = i.trip_id WHERE t.owner_id = $1 AND i.resolved = FALSE",
        [companyId],
      ),
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
