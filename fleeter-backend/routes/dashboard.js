const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

// GET /api/dashboard/stats
// Protected by the 'auth' middleware
router.get("/stats", verifyToken, authorizeRole("owner", "manager"), async (req, res) => {
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
    const [vehicles, drivers, alerts] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM Vehicle WHERE owner_id = $1", [
        companyId,
      ]),
      pool.query(
        "SELECT COUNT(*) FROM Driver WHERE owner_id = $1 AND (status = 'available' OR status = 'dispatched')",
        [companyId],
      ),
      pool.query(
        "SELECT COUNT(*) FROM System_Alert WHERE owner_id = $1 AND resolved = FALSE",
        [companyId],
      ),
    ]);

    res.json({
      totalVehicles: parseInt(vehicles.rows[0].count),
      activeDrivers: parseInt(drivers.rows[0].count),
      alerts: parseInt(alerts.rows[0].count),
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /api/dashboard/analytics
router.get("/analytics", verifyToken, authorizeRole("owner", "manager"), async (req, res) => {
  let client;

  try {
    const companyIdQuery = await pool.query(
      `SELECT owner_id FROM Owner_Profile WHERE user_id = $1 UNION SELECT owner_id FROM Manager_Profile WHERE user_id = $1 AND owner_id IS NOT NULL`,
      [req.user.user_id]
    );
    const companyId = companyIdQuery.rows[0]?.owner_id;
    if (!companyId) return res.json({ utilization: 0, efficiency: [], fuelRanking: [], maintenanceCost: [] });

    // Ensure ACID explicitly even for READ operations per rubric best practices
    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Database Function Call
    const utilRes = await client.query("SELECT calculate_fleet_utilization($1) AS utilization", [companyId]);
    const utilization = parseFloat(utilRes.rows[0].utilization);

    // 2. Complex Query 1: Fleet Efficiency Report
    const efficiencyRes = await client.query(`
      SELECT d.driver_id, d.full_name,
             COUNT(t.trip_id) AS total_trips,
             COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (t.arrival_time - t.departure_time))/3600)::numeric, 2), 0) AS avg_trip_hours,
             (SELECT COUNT(*) FROM Incident i JOIN Trip t2 ON i.trip_id = t2.trip_id WHERE t2.driver_id = d.driver_id) AS incident_count
      FROM Driver d
      LEFT JOIN Trip t ON d.driver_id = t.driver_id AND t.status = 'completed'
      WHERE d.owner_id = $1
      GROUP BY d.driver_id, d.full_name
      ORDER BY total_trips DESC
      LIMIT 5;
    `, [companyId]);

    // 3. Complex Query 2: Fuel Consumption Ranking (Window Function)
    const fuelRes = await client.query(`
      SELECT v.registration_no, v.brand,
             SUM(fl.liters) AS total_liters,
             SUM(fl.liters * fl.cost_per_liter) AS total_fuel_cost,
             RANK() OVER(ORDER BY SUM(fl.liters * fl.cost_per_liter) DESC) AS cost_rank
      FROM Vehicle v
      JOIN Fuel_Log fl ON v.vehicle_id = fl.vehicle_id
      WHERE v.owner_id = $1
      GROUP BY v.vehicle_id, v.registration_no, v.brand
      LIMIT 5;
    `, [companyId]);

    // 4. Complex Query 3: Maintenance Cost by Vehicle Type
    // Changed pool.query to client.query to maintain transaction state
    const maintenanceRes = await client.query(`
      SELECT v.type, COUNT(m.maintenance_id) AS maintenance_events,
             COALESCE(SUM(m.cost), 0) AS total_maintenance_cost
      FROM Vehicle v
      LEFT JOIN Maintenance m ON v.vehicle_id = m.vehicle_id
      WHERE v.owner_id = $1
      GROUP BY v.type
      ORDER BY total_maintenance_cost DESC;
    `, [companyId]);

    await client.query("COMMIT");

    res.json({
      utilization,
      efficiency: efficiencyRes.rows,
      fuelRanking: fuelRes.rows,
      maintenanceCost: maintenanceRes.rows
    });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.error("Error fetching analytics:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  } finally {
    if (client) {
      client.release();
    }
  }
});

module.exports = router;
