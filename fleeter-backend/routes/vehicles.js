const express = require("express");
const router = express.Router();

const pool = require("../config/db");
// Assuming authMiddleware attaches the decoded JWT to req.user
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/vehicles
router.get("/", verifyToken, async (req, res) => {
  try {
    // 1. Extract the authenticated user's ID
    const userId = req.user.user_id;

    // 2. Enforce object-level ownership and fix 3NF last_service_date derivation
    const result = await pool.query(
      `
      SELECT
        v.vehicle_id,
        v.registration_no,
        v.type,
        v.brand,
        v.model,
        v.year,
        v.capacity,
        v.fuel_type,
        (SELECT MAX(service_date) FROM Maintenance m WHERE m.vehicle_id = v.vehicle_id) AS last_service_date,
        v.condition_status,
        v.availability_status,
        assignment.driver_id AS current_driver_id,
        assignment.driver_name AS current_driver_name
      FROM Vehicle v
      LEFT JOIN LATERAL (
        SELECT t.driver_id, d.full_name AS driver_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE t.vehicle_id = v.vehicle_id
          AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC, t.trip_id DESC
        LIMIT 1
      ) assignment ON TRUE
      WHERE v.owner_id = (SELECT owner_id FROM Owner_Profile WHERE user_id = $1)
      ORDER BY v.vehicle_id ASC
    `,
      [userId],
    ); // Parameterized query to prevent SQL injection

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vehicles:", error);

    res.status(500).json({
      message: "Failed to fetch vehicles",
    });
  }
});

// GET /api/vehicles/:vehicleId
router.get("/:vehicleId", verifyToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

    // 1. Parameterize both the vehicle ID and the user's ID
    const result = await pool.query(
      `
      SELECT
        v.vehicle_id,
        v.registration_no,
        v.type,
        v.brand,
        v.model,
        v.year,
        v.capacity,
        v.fuel_type,
        (SELECT MAX(service_date) FROM Maintenance m WHERE m.vehicle_id = v.vehicle_id) AS last_service_date,
        v.condition_status,
        v.availability_status,
        assignment.driver_id AS current_driver_id,
        assignment.driver_name
      FROM Vehicle v
      LEFT JOIN LATERAL (
        SELECT t.driver_id, d.full_name AS driver_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE t.vehicle_id = v.vehicle_id
          AND t.status = 'in_progress'
        ORDER BY t.departure_time DESC, t.trip_id DESC
        LIMIT 1
      ) assignment ON TRUE
      WHERE v.vehicle_id = $1
        AND v.owner_id = (SELECT owner_id FROM Owner_Profile WHERE user_id = $2)
      `,
      [vehicleId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found or you do not have permission to view it",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vehicle:", error);

    res.status(500).json({
      message: "Failed to fetch vehicle",
    });
  }
});

// Add these to your existing routes/vehicles.js
const { authorizeRole } = require("../middleware/authMiddleware");

// Helper to get owner_id
const getOwnerId = async (userId) => {
  const res = await pool.query(
    "SELECT owner_id FROM Owner_Profile WHERE user_id = $1 UNION SELECT owner_id FROM Manager_Profile WHERE user_id = $1",
    [userId],
  );
  return res.rows.length ? res.rows[0].owner_id : null;
};

// POST /api/vehicles (Create new vehicle)
router.post("/", authorizeRole("owner", "manager"), async (req, res) => {
  const { registration_no, brand, type, model, year, capacity, fuel_type } =
    req.body;

  // 1. Input Validation (400 Bad Request)
  if (!registration_no || !type) {
    return res
      .status(400)
      .json({ message: "Registration number and type are required." });
  }

  try {
    const ownerId = await getOwnerId(req.user.user_id);
    if (!ownerId)
      return res.status(403).json({ message: "Owner profile required." });

    // 2. Parameterized Query (SQL Injection Prevention)
    const result = await pool.query(
      `
            INSERT INTO Vehicle (owner_id, registration_no, brand, type, model, year, capacity, fuel_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `,
      [ownerId, registration_no, brand, type, model, year, capacity, fuel_type],
    );

    // 3. REST Convention: 201 Created
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === "23505")
      return res
        .status(409)
        .json({ message: "Registration number already exists." });
    res.status(500).json({ message: "Server error creating vehicle." });
  }
});

// DELETE /api/vehicles/:vehicleId (Delete vehicle)
router.delete(
  "/:vehicleId",
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);

      // Object-Level Ownership Check: Must match vehicle_id AND owner_id
      const result = await pool.query(
        "DELETE FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2 RETURNING *",
        [req.params.vehicleId, ownerId],
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Vehicle not found or unauthorized." });
      }

      // REST Convention: 204 No Content for successful deletion
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting vehicle." });
    }
  },
);

module.exports = router;
