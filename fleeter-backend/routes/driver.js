const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const upload = require("../middleware/upload");
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
          t.trip_id, t.vehicle_id, t.status, t.cargo_type,
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
// PUT /api/driver/trips/:tripId/start
router.put("/trips/:tripId/start", async (req, res) => {
  const { tripId } = req.params;

  if (!req.driver_id)
    return res.status(404).json({ error: "Driver profile not found." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const activeCheck = await client.query(
      `SELECT trip_id FROM Trip
       WHERE driver_id = $1 AND status = 'in_progress'
       FOR UPDATE`,
      [req.driver_id],
    );

    if (activeCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: "You already have an active trip in progress. Complete it before starting another.",
      });
    }

    const result = await client.query(
      `UPDATE Trip
       SET status = 'in_progress', departure_time = NOW()
       WHERE trip_id = $1 AND driver_id = $2 AND status = 'scheduled'
        RETURNING trip_id, vehicle_id, status, departure_time`,
      [tripId, req.driver_id],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Forbidden: Trip not found, already started, or you are not assigned to it.",
      });
    }

    await client.query(
      "UPDATE Driver SET status = 'dispatched' WHERE driver_id = $1",
      [req.driver_id],
    );
    await client.query(
      "UPDATE Vehicle SET availability_status = 'dispatched' WHERE vehicle_id = $1",
      [result.rows[0].vehicle_id],
    );

    await client.query("COMMIT");
    res.json({ message: "Trip started successfully", trip: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error starting trip:", err);
    res.status(500).json({ error: "Failed to start trip." });
  } finally {
    client.release();
  }
});

// PUT /api/driver/trips/:tripId/complete
router.put("/trips/:tripId/complete", async (req, res) => {
  const { tripId } = req.params;

  if (!req.driver_id)
    return res.status(404).json({ error: "Driver profile not found." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE Trip
       SET status = 'completed', arrival_time = NOW()
       WHERE trip_id = $1 AND driver_id = $2 AND status = 'in_progress'
       RETURNING trip_id, vehicle_id, status, arrival_time`,
      [tripId, req.driver_id],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        error: "Forbidden: Trip not found or you are not assigned to it.",
      });
    }

    const remainingDriverTrips = await client.query(
      `
        SELECT 1 FROM Trip
        WHERE driver_id = $1 AND status IN ('scheduled', 'in_progress')
        LIMIT 1
      `,
      [req.driver_id],
    );

    const remainingVehicleTrips = await client.query(
      `
        SELECT 1 FROM Trip
        WHERE vehicle_id = $1 AND status IN ('scheduled', 'in_progress')
        LIMIT 1
      `,
      [result.rows[0].vehicle_id],
    );

    if (remainingDriverTrips.rowCount === 0) {
      await client.query(
        "UPDATE Driver SET status = 'available' WHERE driver_id = $1",
        [req.driver_id],
      );
    }
    if (remainingVehicleTrips.rowCount === 0) {
      await client.query(
        "UPDATE Vehicle SET availability_status = 'available' WHERE vehicle_id = $1",
        [result.rows[0].vehicle_id],
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Trip completed successfully", trip: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error completing trip:", err);
    res.status(500).json({ error: "Failed to complete trip." });
  } finally {
    client.release();
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
  const litersValue = Number(liters);
  const costPerLiterValue = Number(cost_per_liter);
  if (!vehicle_id || !Number.isFinite(litersValue) || litersValue <= 0 || !Number.isFinite(costPerLiterValue) || costPerLiterValue < 0) {
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
        "SELECT 1 FROM Trip WHERE trip_id = $1 AND driver_id = $2 AND vehicle_id = $3",
        [trip_id, req.driver_id, vehicle_id],
      );
      if (tripCheck.rowCount === 0) {
        return res
          .status(403)
          .json({ error: "Forbidden: This vehicle isn't assigned to that trip." });
      }
    }

    const result = await pool.query(
      `INSERT INTO Fuel_Log (vehicle_id, trip_id, logged_by, refuel_time, liters, cost_per_liter, odometer_km, station_name)
       VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7)
       RETURNING *`,
      [
        vehicle_id,
        trip_id,
        req.user.user_id,
        litersValue,
        costPerLiterValue,
        odometer_km,
        station_name,
      ],
    );

    res.status(201).json({ message: "Fuel logged successfully", fuelLog: result.rows[0] });
  } catch (error) {
    console.error("Error inserting fuel log:", error);
    res.status(500).json({ error: "Database error while logging fuel." });
  }
});

// POST /api/driver/log-incident
router.post("/log-incident", upload.single('incidentImage'), async (req, res) => {
  const { trip_id, type, severity, description, reported_to } = req.body;

  // Input Validation
  if (!trip_id || !type || !severity || !["minor", "moderate", "severe", "critical"].includes(severity)) {
    return res
      .status(400)
      .json({ error: "Trip ID, type, and severity are required." });
  }
  if (!req.driver_id)
    return res.status(403).json({ error: "Driver profile missing." });

  // Determine the image path if a file was uploaded
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

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

    // Insert into DB with the new image_url column
    const result = await pool.query(
      `INSERT INTO Incident (trip_id, incident_date, type, description, severity, reported_to, logged_by, image_url)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [trip_id, type, description, severity, reported_to, req.user.user_id, image_url],
    );

    res.status(201).json({
      message: "Incident reported successfully",
      image_url: image_url,
      incident: result.rows[0],
    });
  } catch (error) {
    console.error("Error inserting incident:", error);
    res.status(500).json({ error: "Database error while reporting incident." });
  }
});

// POST /api/driver/request-maintenance
router.post("/request-maintenance", async (req, res) => {

  if (!req.driver_id) return res.status(403).json({ error: "Driver profile missing." });
  const { vehicle_id, service_type, description, odometer_km, workshop } = req.body;
  if (!vehicle_id || !service_type) {
    return res.status(400).json({ error: "Vehicle and service type are required." });
  }

  try {
    const vehicleCheck = await pool.query(
      `SELECT 1 FROM Vehicle v
       JOIN Driver d ON d.owner_id = v.owner_id
       WHERE v.vehicle_id = $1 AND d.driver_id = $2`,
      [vehicle_id, req.driver_id],
    );
    if (vehicleCheck.rowCount === 0) {
      return res.status(403).json({ error: "Forbidden: Vehicle not found." });
    }

    const result = await pool.query(
      `INSERT INTO Maintenance (vehicle_id, service_date, service_type, description, cost, workshop, odometer_km, logged_by)
       VALUES ($1, CURRENT_DATE, $2, $3, 0.00, $4, $5, $6)
       RETURNING *`,
      [vehicle_id, service_type, description, workshop, odometer_km, req.user.user_id],
    );

    res.status(201).json({ message: "Maintenance requested successfully", maintenance: result.rows[0] });
  } catch (error) {
    console.error("Error inserting maintenance record:", error);
    res.status(500).json({ error: "Database error while requesting maintenance." });
  }
});

// ==========================================
// DOCUMENT ROUTES
// ==========================================

// 1. POST /api/driver/documents
router.post("/documents", upload.single("documentFile"), async (req, res) => {
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

    const document_url = req.file ? `/uploads/${req.file.filename}` : null;
    const documentResult = await pool.query(
      `INSERT INTO Driver_Document (driver_id, document_type, document_no, issue_date, expiry_date, document_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING document_id, driver_id, document_type, document_no, issue_date, expiry_date, alert_triggered, document_url`,
      [driverId, document_type, document_no, issue_date, expiry_date, document_url],
    );

    res.status(201).json({
      message: "Document added successfully",
      document: documentResult.rows[0],
    });
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
      `SELECT document_id, document_type, document_no, issue_date, expiry_date, alert_triggered, document_url
       FROM Driver_Document WHERE driver_id = $1 ORDER BY expiry_date ASC`,
      [req.driver_id],
    );
    res.json(docsQuery.rows);
  } catch (error) {
    console.error("Error fetching driver documents:", error);
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// 3. PUT /api/driver/documents/:id
router.put("/documents/:id", upload.single("documentFile"), async (req, res) => {
  const { document_type, document_no, issue_date, expiry_date } = req.body;
  if (!req.driver_id) {
    return res.status(404).json({ error: "Driver profile not found." });
  }
  if (!document_type || !document_no || !issue_date || !expiry_date) {
    return res.status(400).json({ error: "All document fields are required." });
  }

  try {
    const documentUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      `UPDATE Driver_Document
       SET document_type = $1,
           document_no = $2,
           issue_date = $3,
           expiry_date = $4,
           document_url = COALESCE($5, document_url)
       WHERE document_id = $6 AND driver_id = $7
       RETURNING document_id, driver_id, document_type, document_no, issue_date,
         expiry_date, alert_triggered, document_url`,
      [document_type, document_no, issue_date, expiry_date, documentUrl, req.params.id, req.driver_id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.json({ message: "Document updated successfully", document: result.rows[0] });
  } catch (error) {
    console.error("Error updating driver document:", error);
    res.status(500).json({ error: "Failed to update document." });
  }
});

// 4. DELETE /api/driver/documents/:id
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
