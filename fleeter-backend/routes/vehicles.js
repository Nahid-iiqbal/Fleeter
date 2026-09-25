const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");
const { deleteUploadFile, deleteUploadFiles } = require("../utils/uploadFiles");

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
      return res
        .status(404)
        .json({
          message: "Vehicle not found or you do not have permission to view it",
        });
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
  verifyToken,
  authorizeRole("owner", "manager"),
  upload.fields([
    { name: "registrationDocument", maxCount: 1 },
    { name: "vehicleImages", maxCount: 20 },
  ]),
  async (req, res) => {
    const { registration_no, brand, type, model, year, capacity, fuel_type, condition_status, availability_status } = req.body;
    const registrationDocument = req.files?.registrationDocument?.[0];
    const vehicleImages = req.files?.vehicleImages || [];

    if (!registration_no || !type || !registrationDocument) {
      // Clean up orphaned files immediately if validation fails
      if (registrationDocument) await deleteUploadFile(`/uploads/${registrationDocument.filename}`);
      for (const img of vehicleImages) await deleteUploadFile(`/uploads/${img.filename}`);

      return res.status(400).json({ message: "Registration number, type, and registration document are required." });
    }

    const client = await pool.connect();
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      if (!ownerId) {
        if (registrationDocument) await deleteUploadFile(`/uploads/${registrationDocument.filename}`);
        for (const img of vehicleImages) await deleteUploadFile(`/uploads/${img.filename}`);
        return res.status(403).json({ message: "Owner profile required." });
      }

      await client.query("BEGIN");
      const result = await client.query(
        `
        INSERT INTO Vehicle (owner_id, registration_no, brand, type, model, year, capacity, fuel_type, condition_status, availability_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'good'), COALESCE($10, 'available'))
        RETURNING *
        `,
        [
          ownerId,
          registration_no,
          brand,
          type,
          model,
          year,
          capacity,
          fuel_type,
          condition_status,
          availability_status,
        ],
      );

      const vehicle = result.rows[0];
      await client.query(
        `INSERT INTO Vehicle_Document
         (vehicle_id, document_type, document_no, issue_date, expiry_date, document_url)
         VALUES ($1, 'registration', $2, CURRENT_DATE, '9999-12-31', $3)`,
        [
          vehicle.vehicle_id,
          registration_no,
          `/uploads/${registrationDocument.filename}`,
        ],
      );

      for (const image of vehicleImages) {
        await client.query(
          "INSERT INTO Vehicle_Image (vehicle_id, image_url) VALUES ($1, $2)",
          [vehicle.vehicle_id, `/uploads/${image.filename}`],
        );
      }

      await client.query("COMMIT");
      res.status(201).json(vehicle);
    } catch (error) {
      await client.query("ROLLBACK");

      // Clean up newly uploaded files on database transaction failure
      const filesToDelete = [`/uploads/${registrationDocument.filename}`];
      for (const img of vehicleImages) filesToDelete.push(`/uploads/${img.filename}`);
      await deleteUploadFiles(filesToDelete);

      if (error.code === "23505")
        return res.status(409).json({ message: "Registration number already exists." });
      res.status(500).json({ message: "Server error creating vehicle." });
    } finally {
      client.release();
    }
  },
);

// DELETE /api/vehicles/:vehicleId (Delete vehicle)
router.delete(
  "/:vehicleId",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);

      // FIXED: Added `AS file_url` because the UNION takes the column name from the first SELECT (`document_url`),
      // causing `row.file_url` to be undefined below.
      const media = await pool.query(
        `SELECT vd.document_url AS file_url
         FROM Vehicle_Document vd
         JOIN Vehicle v ON v.vehicle_id = vd.vehicle_id
         WHERE vd.vehicle_id = $1 AND v.owner_id = $2
         UNION ALL
         SELECT vi.image_url
         FROM Vehicle_Image vi
         JOIN Vehicle v ON v.vehicle_id = vi.vehicle_id
         WHERE vi.vehicle_id = $1 AND v.owner_id = $2
         UNION ALL
         SELECT i.image_url
         FROM Incident i
         JOIN Trip t ON t.trip_id = i.trip_id
         JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
         WHERE t.vehicle_id = $1 AND v.owner_id = $2`,
        [req.params.vehicleId, ownerId],
      );

      const result = await pool.query(
        "DELETE FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2 RETURNING *",
        [req.params.vehicleId, ownerId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Vehicle not found or unauthorized." });
      }

      // Now row.file_url correctly maps to the union alias
      await deleteUploadFiles(media.rows.map((row) => row.file_url).filter(Boolean));
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error deleting vehicle." });
    }
  },
);

// GET /api/vehicles/:vehicleId/documents (Fetch all documents for a vehicle)
router.get(
  "/:vehicleId/documents",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId],
      );

      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const result = await pool.query(
        "SELECT * FROM Vehicle_Document WHERE vehicle_id = $1 ORDER BY expiry_date DESC",
        [vehicleId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  },
);

// GET /api/vehicles/:vehicleId/images
router.get(
  "/:vehicleId/images",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const result = await pool.query(
        `SELECT vi.image_id, vi.image_url, vi.created_at
         FROM Vehicle_Image vi
         JOIN Vehicle v ON v.vehicle_id = vi.vehicle_id
         WHERE vi.vehicle_id = $1 AND v.owner_id = $2
         ORDER BY vi.created_at DESC, vi.image_id DESC`,
        [req.params.vehicleId, ownerId],
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vehicle images:", error);
      res.status(500).json({ message: "Failed to fetch vehicle images" });
    }
  },
);

// DELETE /api/vehicles/:vehicleId/images/:imageId
router.delete(
  "/:vehicleId/images/:imageId",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const result = await pool.query(
        `DELETE FROM Vehicle_Image vi
         USING Vehicle v
         WHERE vi.image_id = $1
           AND vi.vehicle_id = $2
           AND v.vehicle_id = vi.vehicle_id
           AND v.owner_id = $3
         RETURNING vi.image_id, vi.image_url`,
        [req.params.imageId, req.params.vehicleId, ownerId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Vehicle image not found." });
      }

      await deleteUploadFile(result.rows[0].image_url);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle image:", error);
      res.status(500).json({ message: "Failed to delete vehicle image" });
    }
  },
);

// GET /api/vehicles/:vehicleId/incidents - incidents linked to the vehicle
router.get(
  "/:vehicleId/incidents",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const result = await pool.query(
        `
          SELECT i.incident_id, i.incident_date, i.type, i.description,
            i.severity, i.damage_cost, i.reported_to, i.resolved,
            t.trip_id, d.driver_id, d.full_name AS driver_name
          FROM Incident i
          JOIN Trip t ON t.trip_id = i.trip_id
          JOIN Driver d ON d.driver_id = t.driver_id
          JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
          WHERE v.vehicle_id = $1 AND v.owner_id = $2
          ORDER BY i.incident_date DESC, i.incident_id DESC
        `,
        [req.params.vehicleId, ownerId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vehicle incidents:", error);
      res.status(500).json({ message: "Failed to fetch vehicle incidents" });
    }
  },
);

// GET /api/vehicles/:vehicleId/maintenance - maintenance linked to the vehicle
router.get(
  "/:vehicleId/maintenance",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const result = await pool.query(
        `
          SELECT m.maintenance_id, m.service_date, m.service_type,
            m.description, m.cost, m.workshop, m.mechanic_name,
            m.odometer_km, m.next_due_date, m.next_due_km,
            u.full_name AS logged_by_name
          FROM Maintenance m
          JOIN Vehicle v ON v.vehicle_id = m.vehicle_id
          LEFT JOIN User_Account u ON u.user_id = m.logged_by
          WHERE m.vehicle_id = $1 AND v.owner_id = $2
          ORDER BY m.service_date DESC, m.maintenance_id DESC
        `,
        [req.params.vehicleId, ownerId],
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching vehicle maintenance:", error);
      res.status(500).json({ message: "Failed to fetch vehicle maintenance" });
    }
  },
);

// POST /api/vehicles/:vehicleId/documents (Upload Vehicle Document)
router.post(
  "/:vehicleId/documents",
  verifyToken,
  authorizeRole("owner", "manager"),
  upload.single("documentFile"),
  async (req, res) => {
    const { vehicleId } = req.params;
    const { document_type, document_no, issue_date, expiry_date } = req.body;

    if (!document_type || !document_no || !issue_date || !expiry_date) {
      if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ message: "All document fields are required." });
    }

    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId],
      );

      if (vehicleCheck.rowCount === 0) {
        if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const document_url = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await pool.query(
        `INSERT INTO Vehicle_Document
         (vehicle_id, document_type, document_no, issue_date, expiry_date, document_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          vehicleId,
          document_type,
          document_no,
          issue_date,
          expiry_date,
          document_url,
        ],
      );

      res.status(201).json({
        message: "Vehicle document uploaded successfully",
        document: result.rows[0],
      });
    } catch (error) {
      if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
      console.error("Error uploading vehicle document:", error);
      res.status(500).json({ message: "Server error uploading document." });
    }
  },
);

// PUT /api/vehicles/:vehicleId/documents/:documentId (Edit Vehicle Document)
router.put(
  "/:vehicleId/documents/:documentId",
  verifyToken,
  authorizeRole("owner", "manager"),
  upload.single("documentFile"),
  async (req, res) => {
    try {
      const { vehicleId, documentId } = req.params;
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId],
      );

      if (vehicleCheck.rowCount === 0) {
        if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const { document_type, document_no, issue_date, expiry_date } = req.body;
      let documentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      const previousDocument = await pool.query(
        "SELECT document_url, document_type FROM Vehicle_Document WHERE document_id = $1 AND vehicle_id = $2",
        [documentId, vehicleId],
      );

      let updateQuery = `
        UPDATE Vehicle_Document
        SET
          document_type = COALESCE($1, document_type),
          document_no = COALESCE($2, document_no),
          issue_date = COALESCE($3, issue_date),
          expiry_date = COALESCE($4, expiry_date)
      `;
      let queryParams = [document_type, document_no, issue_date, expiry_date];

      if (documentUrl) {
        updateQuery += `, document_url = $5 WHERE document_id = $6 AND vehicle_id = $7 RETURNING *`;
        queryParams.push(documentUrl, documentId, vehicleId);
      } else {
        updateQuery += ` WHERE document_id = $5 AND vehicle_id = $6 RETURNING *`;
        queryParams.push(documentId, vehicleId);
      }

      const result = await pool.query(updateQuery, queryParams);

      if (result.rowCount === 0) {
        if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
        return res.status(404).json({ message: "Document not found." });
      }

      if (documentUrl) {
        await deleteUploadFile(previousDocument.rows[0]?.document_url);
      }

      res.json({
        message: "Document updated successfully",
        document: result.rows[0],
      });
    } catch (error) {
      if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  },
);

// DELETE /api/vehicles/:vehicleId/documents/:documentId (Delete Vehicle Document)
router.delete(
  "/:vehicleId/documents/:documentId",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const { vehicleId, documentId } = req.params;
      const ownerId = await getOwnerId(req.user.user_id);

      const vehicleCheck = await pool.query(
        "SELECT 1 FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2",
        [vehicleId, ownerId],
      );

      if (vehicleCheck.rowCount === 0) {
        return res.status(403).json({ message: "Vehicle not found or unauthorized." });
      }

      const result = await pool.query(
        "DELETE FROM Vehicle_Document WHERE document_id = $1 AND vehicle_id = $2 RETURNING document_url, document_type",
        [documentId, vehicleId],
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Document not found." });
      }

      await deleteUploadFile(result.rows[0].document_url);

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Server error deleting document." });
    }
  },
);

// POST /api/vehicles/:vehicleId/images
router.post(
  "/:vehicleId/images",
  verifyToken,
  authorizeRole("owner", "manager"),
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const ownerId = await getOwnerId(req.user.user_id);
      const { vehicleId } = req.params;

      const vCheck = await pool.query("SELECT vehicle_id FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2", [vehicleId, ownerId]);
      if (vCheck.rowCount === 0) {
        if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
        return res.status(404).json({ message: "Vehicle not found." });
      }

      if (!req.file) return res.status(400).json({ message: "No image file provided." });

      const result = await pool.query(
        "INSERT INTO Vehicle_Image (vehicle_id, image_url) VALUES ($1, $2) RETURNING *",
        [vehicleId, `/uploads/${req.file.filename}`]
      );
      res.status(201).json({ message: "Image added successfully", image: result.rows[0] });
    } catch (error) {
      if (req.file) await deleteUploadFile(`/uploads/${req.file.filename}`);
      console.error("Error adding vehicle image:", error);
      res.status(500).json({ message: "Failed to add vehicle image" });
    }
  }
);

module.exports = router;
