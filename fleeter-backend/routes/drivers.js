const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt");

// GET /api/driver/trips
router.get("/trips", auth, async (req, res) => {
  try {
    // We added a LEFT JOIN for Owner_Profile to grab the company_name
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
    const driverId = user.driver_id;
    let trips = [];

    if (driverId) {
      const tripsQuery = await pool.query(
        `
        SELECT
          t.trip_id, t.vehicle_id, t.status,
          COALESCE(r.origin, t.origin_address) AS origin,
          COALESCE(r.destination, t.destination_address) AS destination,
          v.registration_no, t.departure_time
        FROM Trip t
        LEFT JOIN Route r ON t.route_id = r.route_id
        JOIN Vehicle v ON t.vehicle_id = v.vehicle_id
        WHERE t.driver_id = $1 AND t.status IN ('scheduled', 'in_progress')
        ORDER BY t.departure_time ASC
      `,
        [driverId],
      );
      trips = tripsQuery.rows;
    }

    res.json({
      name: user.full_name || user.username,
      username: user.username,
      email: user.email,
      companyName: user.company_name || "Unassigned", // Pass the company name to React
      driverProfileMissing: !driverId,
      trips: trips,
    });
  } catch (err) {
    console.error("Error fetching driver trips:", err);
    res.status(500).json({ error: "Failed to fetch driver data." });
  }
});

// ==========================================
// TRIP ACTIONS
// ==========================================

// PUT /api/driver/trips/:tripId/complete
router.put("/trips/:tripId/complete", auth, async (req, res) => {
  const { tripId } = req.params;

  try {
    // First, resolve the driver_id from the authenticated user_id
    const driverQuery = await pool.query(
      "SELECT driver_id FROM Driver WHERE user_id = $1",
      [req.user.user_id]
    );

    if (driverQuery.rows.length === 0) {
      return res.status(404).json({ error: "Driver profile not found." });
    }

    const driverId = driverQuery.rows[0].driver_id;

    // Update the trip status and record arrival time
    const result = await pool.query(
      `UPDATE Trip
       SET status = 'completed', arrival_time = NOW()
       WHERE trip_id = $1 AND driver_id = $2 RETURNING *`,
      [tripId, driverId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Trip not found or unauthorized." });
    }

    res.json({ message: "Trip completed successfully", trip: result.rows[0] });
  } catch (err) {
    console.error("Error completing trip:", err);
    res.status(500).json({ error: "Failed to complete trip." });
  }
});

// PUT /api/driver/account (New route for credential updates)
router.put("/account", auth, async (req, res) => {
  const { username, email, password } = req.body;
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
        .status(400)
        .json({ error: "Username or email is already taken." });
    }
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Failed to update account." });
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

// POST /api/driver/request-maintenance
router.post("/request-maintenance", auth, async (req, res) => {
  const { vehicle_id, service_type, description, odometer_km, workshop } =
    req.body;

  if (!vehicle_id) {
    return res
      .status(400)
      .json({ error: "An active vehicle is required to request maintenance." });
  }

  try {
    await pool.query(
      `
      INSERT INTO Maintenance (vehicle_id, service_date, service_type, description, cost, workshop, odometer_km, logged_by)
      VALUES ($1, CURRENT_DATE, $2, $3, 0.00, $4, $5, $6)
    `,
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

// 1. POST /api/driver/documents (Upload a new document)
router.post("/documents", auth, async (req, res) => {
  const { document_type, document_no, issue_date, expiry_date } = req.body;

  try {
    let driverId;

    // Check if the driver profile exists
    const driverQuery = await pool.query(
      "SELECT driver_id FROM Driver WHERE user_id = $1",
      [req.user.user_id],
    );

    if (driverQuery.rows.length === 0) {
      // Auto-create an unassigned driver profile if missing
      const userQuery = await pool.query(
        "SELECT username FROM User_Account WHERE user_id = $1",
        [req.user.user_id],
      );

      const newDriver = await pool.query(
        `
        INSERT INTO Driver (user_id, full_name, joined_date)
        VALUES ($1, $2, CURRENT_DATE)
        RETURNING driver_id
      `,
        [req.user.user_id, userQuery.rows[0].username],
      );

      driverId = newDriver.rows[0].driver_id;
    } else {
      driverId = driverQuery.rows[0].driver_id;
    }

    // Insert the document
    await pool.query(
      `
      INSERT INTO Driver_Document (driver_id, document_type, document_no, issue_date, expiry_date)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [driverId, document_type, document_no, issue_date, expiry_date],
    );

    res.status(201).json({ message: "Document added successfully" });
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({ error: "Failed to add document." });
  }
});

// 2. GET /api/driver/documents (View documents)
router.get("/documents", auth, async (req, res) => {
  try {
    const driverQuery = await pool.query(
      "SELECT driver_id FROM Driver WHERE user_id = $1",
      [req.user.user_id],
    );

    if (driverQuery.rows.length === 0) {
      return res.json([]);
    }

    const driverId = driverQuery.rows[0].driver_id;

    const docsQuery = await pool.query(
      `
      SELECT document_id, document_type, document_no, issue_date, expiry_date, alert_triggered
      FROM Driver_Document
      WHERE driver_id = $1
      ORDER BY expiry_date ASC
    `,
      [driverId],
    );

    res.json(docsQuery.rows);
  } catch (error) {
    console.error("Error fetching driver documents:", error);
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// 3. DELETE /api/driver/documents/:id (Delete a document)
router.delete("/documents/:id", auth, async (req, res) => {
  try {
    const documentId = req.params.id;

    const driverQuery = await pool.query(
      "SELECT driver_id FROM Driver WHERE user_id = $1",
      [req.user.user_id],
    );

    if (driverQuery.rows.length === 0) {
      return res.status(404).json({ error: "Driver profile not found." });
    }

    const driverId = driverQuery.rows[0].driver_id;

    const deleteResult = await pool.query(
      "DELETE FROM Driver_Document WHERE document_id = $1 AND driver_id = $2 RETURNING *",
      [documentId, driverId],
    );

    if (deleteResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Document not found or unauthorized." });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document." });
  }
});

module.exports = router;
