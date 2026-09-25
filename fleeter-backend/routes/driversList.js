const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

let profilePictureColumnPromise;
const ensureProfilePictureColumn = () => {
  if (!profilePictureColumnPromise) {
    profilePictureColumnPromise = pool.query(
      "ALTER TABLE User_Account ADD COLUMN IF NOT EXISTS profile_picture_url TEXT"
    ).catch(e => {
      profilePictureColumnPromise = null;
      throw e;
    });
  }
  return profilePictureColumnPromise;
};

// GET /api/drivers
router.get("/", verifyToken, authorizeRole("owner", "manager", "admin"), async (req, res) => {
  try {
    await ensureProfilePictureColumn();
    const result = await pool.query(
      `
      SELECT
        d.driver_id,
        d.full_name,
        d.phone,
        d.status,
        d.joined_date,
        d.created_at,
        u.username,
        u.email,
        document.document_no,
        document.document_type,
        document.document_no AS license_no,
        document.document_type AS license_type,
        document.expiry_date AS license_expiry
      FROM Driver d
      LEFT JOIN User_Account u ON u.user_id = d.user_id
      LEFT JOIN LATERAL (
        SELECT document_no, document_type, expiry_date
        FROM Driver_Document
        WHERE driver_id = d.driver_id
        ORDER BY expiry_date DESC
        LIMIT 1
      ) document ON TRUE
      WHERE $1 = 'admin'
         OR d.owner_id = COALESCE(
           (SELECT owner_id FROM Owner_Profile WHERE user_id = $2),
           (SELECT owner_id FROM Manager_Profile WHERE user_id = $2)
         )
      ORDER BY d.driver_id ASC
    `,
      [req.user.role, req.user.user_id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching drivers:", error);

    res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
});

// GET /api/drivers/:driverId
router.get("/:driverId", verifyToken, authorizeRole("owner", "manager", "admin", "driver"), async (req, res) => {
  try {
    // FIX: Defend against "undefined" or null strings crashing Postgres
    const driverId = parseInt(req.params.driverId, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({ message: "Invalid driver ID format." });
    }

    await ensureProfilePictureColumn();

    const result = await pool.query(
      `
        SELECT
          d.driver_id,
          d.full_name,
          d.phone,
          d.status,
          d.joined_date,
          d.created_at,
          u.username,
          u.email,
          u.profile_picture_url,
          document.document_no,
          document.document_type,
          document.issue_date AS document_issue_date,
          document.expiry_date AS document_expiry_date,
          document.document_no AS license_no,
          document.document_type AS license_type,
          document.expiry_date AS license_expiry
        FROM Driver d
        LEFT JOIN User_Account u ON u.user_id = d.user_id
        LEFT JOIN LATERAL (
          SELECT document_no, document_type, issue_date, expiry_date
          FROM Driver_Document
          WHERE driver_id = d.driver_id
          ORDER BY expiry_date DESC
          LIMIT 1
        ) document ON TRUE
        WHERE d.driver_id = $1
          AND ($2 = 'admin' OR d.user_id = $3 OR d.owner_id = COALESCE(
            (SELECT owner_id FROM Owner_Profile WHERE user_id = $3),
            (SELECT owner_id FROM Manager_Profile WHERE user_id = $3)
          ))
      `,
      [driverId, req.user.role, req.user.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching driver:", error);

    res.status(500).json({
      message: "Failed to fetch driver",
    });
  }
});

// PUT /api/drivers/:driverId/status
router.put(
  "/:driverId/status",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    const { status } = req.body;
    if (!["available", "suspended", "on_leave"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be available, suspended, or on_leave." });
    }

    try {
      const ownerResult = await pool.query(
        `SELECT owner_id FROM Owner_Profile WHERE user_id = $1
         UNION
         SELECT owner_id FROM Manager_Profile WHERE user_id = $1`,
        [req.user.user_id],
      );
      const ownerId = ownerResult.rows[0]?.owner_id;

      if (!ownerId) {
        return res.status(403).json({ message: "Company membership is required." });
      }

      const result = await pool.query(
        `UPDATE Driver
         SET status = $1
         WHERE driver_id = $2
           AND owner_id = $3
           AND status IN ('available', 'suspended', 'on_leave')
         RETURNING driver_id, status`,
        [status, req.params.driverId, ownerId],
      );

      if (result.rowCount === 0) {
        return res.status(409).json({
          message: "Only available, suspended, or on-leave drivers in your company can change status.",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating driver status:", error);
      res.status(500).json({ message: "Failed to update driver status." });
    }
  },
);

// DELETE /api/drivers/:driverId - remove a driver from the current company
router.delete(
  "/:driverId",
  verifyToken,
  authorizeRole("owner", "manager"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const companyResult = await client.query(
        `SELECT owner_id FROM Owner_Profile WHERE user_id = $1
         UNION
         SELECT owner_id FROM Manager_Profile WHERE user_id = $1`,
        [req.user.user_id],
      );
      const ownerId = companyResult.rows[0]?.owner_id;

      if (!ownerId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Company membership is required." });
      }

      const driverResult = await client.query(
        `SELECT user_id
         FROM Driver
         WHERE driver_id = $1 AND owner_id = $2
         FOR UPDATE`,
        [req.params.driverId, ownerId],
      );

      if (driverResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Driver not found in your company." });
      }

      const userId = driverResult.rows[0].user_id;

      await client.query(
        `DELETE FROM Fuel_Log
         WHERE trip_id IN (SELECT trip_id FROM Trip WHERE driver_id = $1)`,
        [req.params.driverId],
      );
      await client.query("DELETE FROM Trip WHERE driver_id = $1", [
        req.params.driverId,
      ]);

      if (userId) {
        await client.query(
          `DELETE FROM Company_Request
           WHERE requester_user_id = $1 AND status IN ('pending', 'approved')`,
          [userId],
        );
      }

      await client.query(
        `UPDATE Driver
         SET owner_id = NULL, status = 'available'
         WHERE driver_id = $1 AND owner_id = $2`,
        [req.params.driverId, ownerId],
      );

      await client.query("COMMIT");
      res.json({ message: "Driver terminated and released from the company." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error terminating driver:", error);
      res.status(500).json({ message: "Failed to terminate driver." });
    } finally {
      client.release();
    }
  },
);

// GET /api/drivers/:driverId/documents - documents visible to the driver's company
// FIX 2: Added authorizeRole middleware for consistency and defense-in-depth
router.get("/:driverId/documents", verifyToken, authorizeRole("owner", "manager", "admin", "driver"), async (req, res) => {
  try {
    // FIX: Defend against "undefined" strings
    const driverId = parseInt(req.params.driverId, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({ message: "Invalid driver ID format." });
    }

    const result = await pool.query(
      `
        SELECT dd.document_id, dd.driver_id, dd.document_type, dd.document_no,
          dd.issue_date, dd.expiry_date, dd.alert_triggered, dd.document_url
        FROM Driver_Document dd
        JOIN Driver d ON d.driver_id = dd.driver_id
        WHERE d.driver_id = $1
          AND ($2 = 'admin' OR d.user_id = $3 OR d.owner_id = COALESCE(
            (SELECT owner_id FROM Owner_Profile WHERE user_id = $3),
            (SELECT owner_id FROM Manager_Profile WHERE user_id = $3)
          ))
        ORDER BY dd.expiry_date ASC, dd.document_id DESC
      `,
      [driverId, req.user.role, req.user.user_id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching driver documents:", error);
    res.status(500).json({ message: "Failed to fetch driver documents" });
  }
});

// GET /api/drivers/:driverId/incidents - incidents linked to the driver's trips
// FIX 3: Added authorizeRole middleware here as well
router.get("/:driverId/incidents", verifyToken, authorizeRole("owner", "manager", "admin", "driver"), async (req, res) => {
  try {
    // FIX: Defend against "undefined" strings
    const driverId = parseInt(req.params.driverId, 10);
    if (isNaN(driverId)) {
      return res.status(400).json({ message: "Invalid driver ID format." });
    }

    const result = await pool.query(
      `
        SELECT i.incident_id, i.incident_date, i.type, i.description,
          i.severity, i.damage_cost, i.reported_to, i.resolved,
          t.trip_id, v.registration_no
        FROM Incident i
        JOIN Trip t ON t.trip_id = i.trip_id
        JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE d.driver_id = $1
          AND ($2 = 'admin' OR d.user_id = $3 OR d.owner_id = COALESCE(
            (SELECT owner_id FROM Owner_Profile WHERE user_id = $3),
            (SELECT owner_id FROM Manager_Profile WHERE user_id = $3)
          ))
        ORDER BY i.incident_date DESC, i.incident_id DESC
      `,
      [driverId, req.user.role, req.user.user_id],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching driver incidents:", error);
    res.status(500).json({ message: "Failed to fetch driver incidents" });
  }
});

module.exports = router;
