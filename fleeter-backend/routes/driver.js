const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");

// Middleware to resolve driver_id for the authenticated user
// This prevents us from having to run this query in every single route
const attachDriverId = async (req, res, next) => {
  try {
    const driverQuery = await pool.query(
      "SELECT driver_id FROM Driver WHERE user_id = $1",
      [req.user.user_id],
    );
    if (driverQuery.rows.length > 0) {
      req.driver_id = driverQuery.rows[0].driver_id;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to authenticate driver profile." });
  }
};

// Apply auth, role verification, and driver ID resolution to all routes in this file
router.use(verifyToken);
router.use(authorizeRole("driver"));
router.use(attachDriverId);

// GET /api/driver/trips
router.get("/trips", async (req, res) => {
  try {
    const userQuery = await pool.query(
      `
      SELECT u.username, u.email, d.driver_id, d.full_name, op.company_name
      FROM User_Account u
      LEFT JOIN Driver d ON u.user_id = d.user_id
      LEFT JOIN Owner_Profile op ON d.owner_id = op.owner_id
      WHERE u.user_id = $1
    `,
      [req.user.user_id],
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: "User account not found." });
    }

    const user = userQuery.rows[0];
    let trips = [];

    if (req.driver_id) {
      const tripsQuery = await pool.query(
        `
        SELECT
          t.trip_id, t.vehicle_id, t.status,
          COALESCE(r.origin, t.origin_address) AS origin,
          COALESCE(r.destination, t.destination_address) AS destination,
          v.registration_no, t.departure_time, t.arrival_time
        FROM Trip t
        LEFT JOIN Route r ON t.route_id = r.route_id
        JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
        WHERE t.driver_id = $1
        ORDER BY t.departure_time DESC
      `,
        [req.driver_id],
      );
      trips = tripsQuery.rows;
    }

    res.json({
      name: user.full_name || user.username,
      username: user.username,
      email: user.email,
      companyName: user.company_name || "Unassigned",
      driverProfileMissing: !req.driver_id,
      trips: trips,
    });
  } catch (err) {
    console.error("Error fetching driver trips:", err);
    res.status(500).json({ error: "Failed to fetch driver data." });
  }
});

// PUT /api/driver/trips/:tripId/start
router.put("/trips/:tripId/start", async (req, res) => {
  const { tripId } = req.params;

  if (!req.driver_id)
    return res.status(404).json({ error: "Driver profile not found." });

  try {
    const result = await pool.query(
      `UPDATE Trip
       SET status = 'in_progress', departure_time = NOW()
       WHERE trip_id = $1 AND driver_id = $2 AND status = 'scheduled' RETURNING *`,
      [tripId, req.driver_id],
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error:
          "Forbidden: Trip not found, already started, or you are not assigned to it.",
      });
    }

    res.json({ message: "Trip started successfully", trip: result.rows[0] });
  } catch (err) {
    console.error("Error starting trip:", err);
    res.status(500).json({ error: "Failed to start trip." });
  }
});

// PUT /api/driver/trips/:tripId/complete
router.put("/trips/:tripId/complete", async (req, res) => {
  const { tripId } = req.params;

  if (!req.driver_id)
    return res.status(404).json({ error: "Driver profile not found." });

  try {
    const result = await pool.query(
      `UPDATE Trip
       SET status = 'completed', arrival_time = NOW()
       WHERE trip_id = $1 AND driver_id = $2 RETURNING *`,
      [tripId, req.driver_id],
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Forbidden: Trip not found or you are not assigned to it.",
      });
    }

    res.json({ message: "Trip completed successfully", trip: result.rows[0] });
  } catch (err) {
    console.error("Error completing trip:", err);
    res.status(500).json({ error: "Failed to complete trip." });
  }
});

// PUT /api/driver/account
router.put("/account", async (req, res) => {
  const { username, email, password } = req.body;

  // Input Validation
  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required." });
  }

  try {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await pool.query(
        "UPDATE User_Account SET username = $1, email = $2, password_hash = $3 WHERE user_id = $4",
        [username, email, password_hash, req.user.user_id],
      );
    } else {
      await pool.query(
        "UPDATE User_Account SET username = $1, email = $2 WHERE user_id = $3",
        [username, email, req.user.user_id],
      );
    }
    res.json({ message: "Account updated successfully" });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email is already taken." });
    }
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Failed to update account." });
  }
});

// POST /api/driver/log-fuel
router.post("/log-fuel", async (req, res) => {
  const {
    vehicle_id,
    trip_id,
    liters,
    cost_per_liter,
    odometer_km,
    station_name,
  } = req.body;

  // Input Validation
  if (!vehicle_id || !liters || !cost_per_liter) {
    return res
      .status(400)
      .json({ error: "Vehicle, liters, and cost per liter are required." });
  }
  if (!req.driver_id)
    return res.status(403).json({ error: "Driver profile missing." });

  try {
    // Cross-user access block: Ensure the trip actually belongs to this driver
    if (trip_id) {
      const tripCheck = await pool.query(
        "SELECT 1 FROM Trip WHERE trip_id = $1 AND driver_id = $2",
        [trip_id, req.driver_id],
      );
      if (tripCheck.rowCount === 0) {
        return res
          .status(403)
          .json({ error: "Forbidden: You are not assigned to this trip." });
      }
    }

    await pool.query(
      `INSERT INTO Fuel_Log (vehicle_id, trip_id, logged_by, refuel_time, liters, cost_per_liter, odometer_km, station_name)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)`,
      [
        vehicle_id,
        trip_id,
        req.user.user_id,
        liters,
        cost_per_liter,
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
router.post("/log-incident", async (req, res) => {
  const { trip_id, type, severity, description, reported_to } = req.body;

  // Input Validation
  if (!trip_id || !type || !severity) {
    return res
      .status(400)
      .json({ error: "Trip ID, type, and severity are required." });
  }
  if (!req.driver_id)
    return res.status(403).json({ error: "Driver profile missing." });

  try {
    // Cross-user access block: Ensure the trip actually belongs to this driver
    const tripCheck = await pool.query(
      "SELECT 1 FROM Trip WHERE trip_id = $1 AND driver_id = $2",
      [trip_id, req.driver_id],
    );
    if (tripCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Forbidden: You are not assigned to this trip." });
    }

    await pool.query(
      `INSERT INTO Incident (trip_id, incident_date, type, description, severity, reported_to, logged_by)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6)`,
      [trip_id, type, description, severity, reported_to, req.user.user_id],
    );

    res.status(201).json({ message: "Incident reported successfully" });
  } catch (error) {
    console.error("Error inserting incident:", error);
    res.status(500).json({ error: "Database error while reporting incident." });
  }
});

// POST /api/driver/request-maintenance
router.post("/request-maintenance", async (req, res) => {
  const { vehicle_id, service_type, description, odometer_km, workshop } =
    req.body;

  // Input Validation
  if (!vehicle_id || !service_type) {
    return res
      .status(400)
      .json({ error: "Vehicle and service type are required." });
  }

  try {
    await pool.query(
      `INSERT INTO Maintenance (vehicle_id, service_date, service_type, description, cost, workshop, odometer_km, logged_by)
       VALUES ($1, CURRENT_DATE, $2, $3, 0.00, $4, $5, $6)`,
      [
        vehicle_id,
        service_type,
        description,
        workshop,
        odometer_km,
        req.user.user_id,
      ],
    );

    res.status(201).json({ message: "Maintenance requested successfully" });
  } catch (error) {
    console.error("Error inserting maintenance record:", error);
    res
      .status(500)
      .json({ error: "Database error while requesting maintenance." });
  }
});

// ==========================================
// DOCUMENT ROUTES
// ==========================================

// 1. POST /api/driver/documents
router.post("/documents", async (req, res) => {
  const { document_type, document_no, issue_date, expiry_date } = req.body;

  if (!document_type || !document_no || !issue_date || !expiry_date) {
    return res.status(400).json({ error: "All document fields are required." });
  }

  try {
    let driverId = req.driver_id;

    if (!driverId) {
      const userQuery = await pool.query(
        "SELECT username FROM User_Account WHERE user_id = $1",
        [req.user.user_id],
      );
      const newDriver = await pool.query(
        `INSERT INTO Driver (user_id, full_name, joined_date) VALUES ($1, $2, CURRENT_DATE) RETURNING driver_id`,
        [req.user.user_id, userQuery.rows[0].username],
      );
      driverId = newDriver.rows[0].driver_id;
    }

    await pool.query(
      `INSERT INTO Driver_Document (driver_id, document_type, document_no, issue_date, expiry_date)
       VALUES ($1, $2, $3, $4, $5)`,
      [driverId, document_type, document_no, issue_date, expiry_date],
    );

    res.status(201).json({ message: "Document added successfully" });
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({ error: "Failed to add document." });
  }
});

// 2. GET /api/driver/documents
router.get("/documents", async (req, res) => {
  if (!req.driver_id) return res.json([]);

  try {
    const docsQuery = await pool.query(
      `SELECT document_id, document_type, document_no, issue_date, expiry_date, alert_triggered
       FROM Driver_Document WHERE driver_id = $1 ORDER BY expiry_date ASC`,
      [req.driver_id],
    );
    res.json(docsQuery.rows);
  } catch (error) {
    console.error("Error fetching driver documents:", error);
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// 3. DELETE /api/driver/documents/:id
router.delete("/documents/:id", async (req, res) => {
  const documentId = req.params.id;
  if (!req.driver_id)
    return res.status(404).json({ error: "Driver profile not found." });

  try {
    const deleteResult = await pool.query(
      "DELETE FROM Driver_Document WHERE document_id = $1 AND driver_id = $2 RETURNING *",
      [documentId, req.driver_id],
    );

    if (deleteResult.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "Forbidden: Document not found or you do not own it." });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document." });
  }
});

module.exports = router;
