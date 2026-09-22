const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

// Helper to get owner_id
const getOwnerId = async (userId) => {
  const res = await pool.query(
    "SELECT owner_id FROM Owner_Profile WHERE user_id = $1 UNION SELECT owner_id FROM Manager_Profile WHERE user_id = $1",
    [userId],
  );
  return res.rows.length ? res.rows[0].owner_id : null;
};

// GET /api/vehicles
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

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
      WHERE v.owner_id = COALESCE(
        (SELECT owner_id FROM Owner_Profile WHERE user_id = $1),
        (SELECT owner_id FROM Manager_Profile WHERE user_id = $1)
      )
      ORDER BY v.vehicle_id ASC
    `,
      [userId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

// GET /api/vehicles/:vehicleId
router.get("/:vehicleId", verifyToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const userId = req.user.user_id;

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
        AND v.owner_id = COALESCE(
          (SELECT owner_id FROM Owner_Profile WHERE user_id = $2),
          (SELECT owner_id FROM Manager_Profile WHERE user_id = $2)
        )
      `,
      [vehicleId, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found or you do not have permission to view it" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Failed to fetch vehicle" });
  }
});

// POST /api/vehicles (Create new vehicle)
router.post(
  "/",
  verifyToken, // <-- ADDED
  authorizeRole("owner", "manager"),
  async (req, res) => {
    const { registration_no, brand, type, model, year, capacity, fuel_type } = req.body;

    if (!registration_no || !type) {
      return res.status(400).json({ message: "Registration number and type are required." });
    }

    try {
      const ownerId = await getOwnerId(req.user.user_id);
      if (!ownerId) return res.status(403).json({ message: "Owner profile required." });

      const result = await pool.query(
        `
        INSERT INTO Vehicle (owner_id, registration_no, brand, type, model, year, capacity, fuel_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [ownerId, registration_no, brand, type, model, year, capacity, fuel_type],
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      if (error.code === "23505")
        return res.status(409).json({ message: "Registration number already exists." });
      res.status(500).json({ message: "Server error creating vehicle." });
    }
  }
);

// DELETE /api/vehicles/:vehicleId (Delete vehicle)
router.delete(
  "/:vehicleId",
  verifyToken, // <-- ADDED
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);

      const result = await pool.query(
        "DELETE FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2 RETURNING *",
        [req.params.vehicleId, ownerId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Vehicle not found or unauthorized." });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Server error deleting vehicle." });
    }
  }
);

// GET /api/vehicles/:vehicleId/documents (Fetch all documents for a vehicle)
router.get(
  "/:vehicleId/documents",
  verifyToken, // <-- ADDED
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId]
      );

      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const result = await pool.query(
        "SELECT * FROM Vehicle_Document WHERE vehicle_id = $1 ORDER BY expiry_date DESC",
        [vehicleId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  }
);

// POST /api/vehicles/:vehicleId/documents (Upload Vehicle Document)
router.post(
  "/:vehicleId/documents",
  verifyToken, // <-- ADDED
  authorizeRole("owner", "manager"),
  upload.single("documentFile"),
  async (req, res) => {
    const { vehicleId } = req.params;
    const { document_type, document_no, issue_date, expiry_date } = req.body;

    if (!document_type || !document_no || !issue_date || !expiry_date) {
      return res.status(400).json({ message: "All document fields are required." });
    }

    try {
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId]
      );

      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const document_url = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await pool.query(
        `INSERT INTO Vehicle_Document
         (vehicle_id, document_type, document_no, issue_date, expiry_date, document_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [vehicleId, document_type, document_no, issue_date, expiry_date, document_url]
      );

      res.status(201).json({
        message: "Vehicle document uploaded successfully",
        document: result.rows[0]
      });
    } catch (error) {
      console.error("Error uploading vehicle document:", error);
      res.status(500).json({ message: "Server error uploading document." });
    }
  }
);

// DELETE /api/vehicles/:vehicleId/documents/:documentId (Delete Vehicle Document)
router.delete(
  "/:vehicleId/documents/:documentId",
  verifyToken, // <-- ADDED
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const { vehicleId, documentId } = req.params;
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId]
      );

      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const result = await pool.query(
        "DELETE FROM Vehicle_Document WHERE document_id = $1 AND vehicle_id = $2 RETURNING *",
        [documentId, vehicleId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Document not found." });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Server error deleting document." });
    }
  }
);

module.exports = router;
