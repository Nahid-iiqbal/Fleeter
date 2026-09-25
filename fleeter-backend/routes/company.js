const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

router.use(verifyToken);

// GET /api/company/context - the current user's company membership
router.get("/context", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          u.role,
          membership.owner_id AS company_id,
          company.company_name
        FROM User_Account u
        LEFT JOIN Owner_Profile own ON own.user_id = u.user_id
        LEFT JOIN Manager_Profile manager ON manager.user_id = u.user_id
        LEFT JOIN Driver driver ON driver.user_id = u.user_id
        LEFT JOIN Owner_Profile company ON company.owner_id = COALESCE(
          own.owner_id,
          manager.owner_id,
          driver.owner_id
        )
        LEFT JOIN LATERAL (
          SELECT COALESCE(own.owner_id, manager.owner_id, driver.owner_id) AS owner_id
        ) membership ON TRUE
        WHERE u.user_id = $1
      `,
      [req.user.user_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User account not found." });
    }

    const context = result.rows[0];
    res.json({
      ...context,
      hasCompany: context.company_id !== null,
      companyName: context.company_name || null,
    });
  } catch (error) {
    console.error("Error fetching company context:", error);
    res.status(500).json({ message: "Failed to fetch company context." });
  }
});

const getCompanyId = async (userId) => {
  const result = await pool.query(
    `
      SELECT owner_id FROM Owner_Profile WHERE user_id = $1
      UNION
      SELECT owner_id FROM Manager_Profile WHERE user_id = $1 AND owner_id IS NOT NULL
    `,
    [userId],
  );
  return result.rows[0]?.owner_id || null;
};

const ensureSystemAlertTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS System_Alert (
      alert_id SERIAL PRIMARY KEY,
      owner_id INT NOT NULL REFERENCES Owner_Profile(owner_id) ON DELETE CASCADE,
      alert_type VARCHAR(40) NOT NULL,
      reference_type VARCHAR(40) NOT NULL,
      reference_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      about VARCHAR(200) NOT NULL,
      description TEXT,
      severity VARCHAR(20) DEFAULT 'medium',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      deadline TIMESTAMPTZ,
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}'::jsonb,
      UNIQUE (owner_id, alert_type, reference_type, reference_id)
    )
  `);
};

const normalizeAlertStatus = (alert) => {
  if (alert.resolved) return "resolved";
  if (alert.deadline && new Date(alert.deadline) < new Date())
    return "deadline expired";
  return "needs to be resolved";
};

const buildAlertRecord = ({
  ownerId,
  alertType,
  referenceType,
  referenceId,
  title,
  about,
  description,
  severity = "medium",
  deadline = null,
  metadata = {},
}) => ({
  owner_id: ownerId,
  alert_type: alertType,
  reference_type: referenceType,
  reference_id: referenceId,
  title,
  about,
  description,
  severity,
  deadline,
  metadata,
});

const upsertCompanyAlerts = async (companyId) => {
  await ensureSystemAlertTable();

  const alerts = [];

  const incidentRows = await pool.query(
    `
      SELECT i.incident_id, i.type, i.description, i.severity, i.incident_date AS created_at,
        i.reported_to, i.damage_cost, i.image_url, t.trip_id, t.vehicle_id,
        d.driver_id, d.full_name AS driver_name,
        v.registration_no, v.brand, v.model,
        CONCAT('Incident on trip #', t.trip_id) AS title,
        CONCAT('Vehicle ', v.registration_no, ' · ', d.full_name) AS about
      FROM Incident i
      JOIN Trip t ON t.trip_id = i.trip_id
      JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
      JOIN Driver d ON d.driver_id = t.driver_id
      WHERE t.owner_id = $1 AND i.resolved = FALSE
    `,
    [companyId],
  );

  incidentRows.rows.forEach((row) => alerts.push(buildAlertRecord({
    ownerId: companyId,
    alertType: "incident",
    referenceType: "incident",
    referenceId: row.incident_id,
    title: row.title,
    about: row.about,
    description: [
      `Incident type: ${row.type}.`,
      `Severity: ${row.severity || "not specified"}.`,
      row.reported_to ? `Reported to: ${row.reported_to}.` : null,
      row.damage_cost ? `Damage cost: ${row.damage_cost}.` : null,
      row.image_url ? "Evidence image attached." : null,
      `Driver notes: ${row.description || "No driver notes provided."}`,
    ].filter(Boolean).join("\n"),
    severity: row.severity || "high",
    metadata: {
      trip_id: row.trip_id || null,
      vehicle_id: row.vehicle_id || null,
      vehicle_name: [row.registration_no, row.brand, row.model].filter(Boolean).join(" ") || null,
      driver_id: row.driver_id || null,
      driver_name: row.driver_name || null,
      incident_type: row.type,
      reported_to: row.reported_to || null,
      damage_cost: row.damage_cost || null,
      image_url: row.image_url || null,
    },
  })));

  const maintenanceRows = await pool.query(
    `
      SELECT m.maintenance_id, m.service_date AS created_at, m.service_type, m.description,
        m.cost, m.workshop, m.mechanic_name, m.odometer_km, m.next_due_km,
        m.next_due_date AS deadline, v.vehicle_id, v.registration_no, v.brand, v.model,
        assignment.driver_id, assignment.driver_name
      FROM Maintenance m
      JOIN Vehicle v ON v.vehicle_id = m.vehicle_id
      LEFT JOIN LATERAL (
        SELECT t.driver_id, d.full_name AS driver_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        WHERE t.vehicle_id = v.vehicle_id
        ORDER BY (t.status = 'in_progress') DESC, t.departure_time DESC, t.trip_id DESC
        LIMIT 1
      ) assignment ON TRUE
      WHERE v.owner_id = $1 AND m.next_due_date IS NOT NULL AND m.next_due_date <= CURRENT_DATE + INTERVAL '14 days'
    `,
    [companyId],
  );

  maintenanceRows.rows.forEach((row) => alerts.push(buildAlertRecord({
    ownerId: companyId,
    alertType: "maintenance",
    referenceType: "maintenance",
    referenceId: row.maintenance_id,
    title: `Maintenance needed for ${row.registration_no}`,
    about: row.service_type,
    description: [
      `Maintenance type: ${row.service_type}.`,
      row.workshop ? `Workshop: ${row.workshop}.` : null,
      row.mechanic_name ? `Mechanic: ${row.mechanic_name}.` : null,
      row.cost !== null ? `Cost: ${row.cost}.` : null,
      row.odometer_km !== null ? `Odometer: ${row.odometer_km} km.` : null,
      row.next_due_km !== null ? `Next due at: ${row.next_due_km} km.` : null,
      `Driver notes: ${row.description || "No maintenance notes provided."}`,
    ].filter(Boolean).join("\n"),
    severity: "medium",
    deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
    metadata: {
      vehicle_id: row.vehicle_id,
      vehicle_name: [row.registration_no, row.brand, row.model].filter(Boolean).join(" "),
      vehicle_registration: row.registration_no,
      driver_id: row.driver_id || null,
      driver_name: row.driver_name || null,
      service_type: row.service_type,
      workshop: row.workshop || null,
      mechanic_name: row.mechanic_name || null,
      cost: row.cost,
      odometer_km: row.odometer_km,
      next_due_km: row.next_due_km,
    },
  })));

  const driverDocRows = await pool.query(
    `
      SELECT dd.document_id, dd.document_type, dd.issue_date, dd.expiry_date AS deadline,
             d.full_name, d.driver_id
      FROM Driver_Document dd
      JOIN Driver d ON d.driver_id = dd.driver_id
      WHERE d.owner_id = $1
        AND (dd.issue_date IS NULL OR dd.expiry_date IS NULL OR dd.expiry_date < CURRENT_DATE)
    `,
    [companyId],
  );

  driverDocRows.rows.forEach((row) => alerts.push(buildAlertRecord({
    ownerId: companyId,
    alertType: "driver_document_expired",
    referenceType: "driver_document",
    referenceId: row.document_id,
    title: `${row.full_name} driver document expired`,
    about: row.document_type,
    description: `The ${row.document_type} for ${row.full_name} has missing or expired date information.`,
    severity: "high",
    deadline: row.deadline ? new Date(row.deadline).toISOString() : null,
    metadata: {
      driver_id: row.driver_id,
      driver_name: row.full_name,
      document_id: row.document_id,
      document_type: row.document_type,
      issue_date: row.issue_date,
      expiry_date: row.deadline,
      date_issue: row.issue_date ? null : "missing",
      date_expiry: row.deadline ? (new Date(row.deadline) < new Date() ? "expired" : null) : "missing",
    },
  })));

  const driversWithoutDocuments = await pool.query(
    `
      SELECT d.driver_id, d.full_name
      FROM Driver d
      LEFT JOIN Driver_Document dd ON dd.driver_id = d.driver_id
      WHERE d.owner_id = $1 AND dd.document_id IS NULL
    `,
    [companyId],
  );

  driversWithoutDocuments.rows.forEach((row) => alerts.push(buildAlertRecord({
    ownerId: companyId,
    alertType: "driver_document_missing",
    referenceType: "driver",
    referenceId: row.driver_id,
    title: `${row.full_name} has no driver document`,
    about: "Driver licence document missing",
    description: `No driver document has been uploaded for ${row.full_name}.`,
    severity: "high",
    metadata: {
      driver_id: row.driver_id,
      driver_name: row.full_name,
      document_id: null,
      document_type: "driving_license",
      issue_date: null,
      expiry_date: null,
      date_issue: "missing",
      date_expiry: "missing",
    },
  })));

  const vehicleDocRows = await pool.query(
    `
      SELECT vd.document_id, vd.document_type, vd.expiry_date AS deadline,
             v.vehicle_id, v.registration_no
      FROM Vehicle_Document vd
      JOIN Vehicle v ON v.vehicle_id = vd.vehicle_id
      WHERE v.owner_id = $1 AND vd.expiry_date < CURRENT_DATE
    `,
    [companyId],
  );

  vehicleDocRows.rows.forEach((row) =>
    alerts.push(
      buildAlertRecord({
        ownerId: companyId,
        alertType: "vehicle_document_expired",
        referenceType: "vehicle_document",
        referenceId: row.document_id,
        title: `Vehicle document expired for ${row.registration_no}`,
        about: row.document_type,
        description: `The ${row.document_type} for vehicle ${row.registration_no} expired on ${new Date(row.deadline).toISOString().split("T")[0]}.`,
        severity: "high",
        deadline: new Date(row.deadline).toISOString(),
        metadata: {
          vehicle_id: row.vehicle_id,
          document_type: row.document_type,
        },
      }),
    ),
  );

  const refuelRows = await pool.query(
    `
      SELECT fl.fuel_id, fl.refuel_time AS created_at, fl.trip_id, fl.station_name,
        fl.liters, fl.cost_per_liter, fl.odometer_km, v.vehicle_id,
        v.registration_no, v.brand, v.model, t.driver_id, d.full_name AS driver_name
      FROM Fuel_Log fl
      JOIN Vehicle v ON v.vehicle_id = fl.vehicle_id
      LEFT JOIN Trip t ON t.trip_id = fl.trip_id
      LEFT JOIN Driver d ON d.driver_id = t.driver_id
      WHERE v.owner_id = $1
      ORDER BY fl.refuel_time DESC
    `,
    [companyId],
  );

  refuelRows.rows.forEach((row) => alerts.push(buildAlertRecord({
    ownerId: companyId,
    alertType: "refuel",
    referenceType: "fuel_log",
    referenceId: row.fuel_id,
    title: `Vehicle refuelled - ${row.registration_no}`,
    about: row.station_name || "Fueling station",
    description: `Fuel log: ${row.liters} liters at ${row.cost_per_liter} per liter. Station: ${row.station_name || "Not provided"}. Odometer: ${row.odometer_km ?? "Not provided"} km. Mark as resolved once the check is complete.`,
    severity: "low",
    metadata: {
      vehicle_id: row.vehicle_id,
      vehicle_name: [row.registration_no, row.brand, row.model].filter(Boolean).join(" "),
      vehicle_registration: row.registration_no,
      driver_id: row.driver_id || null,
      driver_name: row.driver_name || null,
      trip_id: row.trip_id || null,
      station_name: row.station_name || null,
      liters: row.liters,
      cost_per_liter: row.cost_per_liter,
      odometer_km: row.odometer_km || null,
    },
  })));

  if (alerts.length === 0) {
    return [];
  }

  for (const alert of alerts) {
    await pool.query(
      `
        INSERT INTO System_Alert (
          owner_id, alert_type, reference_type, reference_id, title, about,
          description, severity, deadline, resolved, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        ON CONFLICT (owner_id, alert_type, reference_type, reference_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          about = EXCLUDED.about,
          description = EXCLUDED.description,
          severity = EXCLUDED.severity,
          deadline = EXCLUDED.deadline,
          metadata = EXCLUDED.metadata
      `,
      [
        alert.owner_id,
        alert.alert_type,
        alert.reference_type,
        alert.reference_id,
        alert.title,
        alert.about,
        alert.description || null,
        alert.severity,
        alert.deadline,
        false,
        JSON.stringify(alert.metadata || {}),
      ],
    );
  }

  const result = await pool.query(
    `
      SELECT *
      FROM System_Alert
      WHERE owner_id = $1
      ORDER BY resolved ASC, created_at DESC
    `,
    [companyId],
  );

  return result.rows;
};

// GET /api/company/routes - active routes belonging to the current company
router.get("/routes", authorizeRole("owner", "manager"), async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) {
      return res.json([]);
    }

    const result = await pool.query(
      `
        SELECT route_id, route_name, origin, destination, distance_km, est_mins
        FROM Route
        WHERE owner_id = $1 AND is_active = TRUE
        ORDER BY route_name ASC, route_id ASC
      `,
      [companyId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company routes:", error);
    res.status(500).json({ message: "Failed to fetch routes." });
  }
});

// POST /api/company/trips - assign a scheduled trip to a company driver
router.post("/trips", authorizeRole("owner", "manager"), async (req, res) => {
  const {
    driver_id,
    vehicle_id,
    route_id,
    origin_address,
    destination_address,
    route_name,
    custom_route,
    departure_time,
    cargo_type,
    notes,
  } = req.body;

  const driverId = Number(driver_id);
  const vehicleId = Number(vehicle_id);
  const routeId = route_id ? Number(route_id) : null;

  if (!Number.isInteger(driverId) || !Number.isInteger(vehicleId)) {
    return res
      .status(400)
      .json({ message: "Driver and vehicle are required." });
  }
  if (!departure_time) {
    return res.status(400).json({ message: "Departure time is required." });
  }
  if (cargo_type && !["cargo", "passengers"].includes(cargo_type)) {
    return res
      .status(400)
      .json({ message: "Cargo type must be cargo or passengers." });
  }
  if (
    custom_route &&
    (!origin_address?.trim() || !destination_address?.trim())
  ) {
    return res
      .status(400)
      .json({
        message: "Origin and destination are required for a custom route.",
      });
  }
  if (custom_route && !route_name?.trim()) {
    return res
      .status(400)
      .json({ message: "Route name is required for a custom route." });
  }
  if (custom_route && route_name.trim().length > 100) {
    return res
      .status(400)
      .json({ message: "Route name must be 100 characters or fewer." });
  }
  if (
    custom_route &&
    (origin_address.trim().length > 100 ||
      destination_address.trim().length > 100)
  ) {
    return res
      .status(400)
      .json({
        message: "Origin and destination must be 100 characters or fewer.",
      });
  }
  if (!custom_route && !routeId) {
    return res
      .status(400)
      .json({ message: "Select an existing route or add a custom route." });
  }

  const companyId = await getCompanyId(req.user.user_id);
  if (!companyId) {
    return res
      .status(403)
      .json({ message: "Company membership is required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const driverResult = await client.query(
      "SELECT driver_id FROM Driver WHERE driver_id = $1 AND owner_id = $2 FOR UPDATE",
      [driverId, companyId],
    );
    const vehicleResult = await client.query(
      "SELECT vehicle_id FROM Vehicle WHERE vehicle_id = $1 AND owner_id = $2 FOR UPDATE",
      [vehicleId, companyId],
    );
    if (!driverResult.rowCount || !vehicleResult.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Driver or vehicle not found in your company." });
    }

    let assignedRouteId = routeId;
    let tripOrigin = origin_address || null;
    let tripDestination = destination_address || null;

    if (custom_route) {
      const routeResult = await client.query(
        `
          INSERT INTO Route (owner_id, route_name, origin, destination)
          VALUES ($1, $2, $3, $4)
          RETURNING route_id
        `,
        [
          companyId,
          route_name.trim(),
          origin_address.trim(),
          destination_address.trim(),
        ],
      );
      assignedRouteId = routeResult.rows[0].route_id;
    } else {
      const routeResult = await client.query(
        "SELECT route_id FROM Route WHERE route_id = $1 AND owner_id = $2 AND is_active = TRUE",
        [routeId, companyId],
      );
      if (!routeResult.rowCount) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ message: "Selected route was not found in your company." });
      }
    }

    const tripResult = await client.query(
      `
        INSERT INTO Trip (
          owner_id, vehicle_id, driver_id, route_id, origin_address,
          destination_address, departure_time, cargo_type, notes, dispatched_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING trip_id, status, departure_time
      `,
      [
        companyId,
        vehicleId,
        driverId,
        assignedRouteId,
        tripOrigin,
        tripDestination,
        departure_time,
        cargo_type || null,
        notes?.trim() || null,
        req.user.user_id,
      ],
    );

    await client.query(
      "UPDATE Driver SET status = 'dispatched' WHERE driver_id = $1",
      [driverId],
    );
    await client.query(
      "UPDATE Vehicle SET availability_status = 'dispatched' WHERE vehicle_id = $1",
      [vehicleId],
    );
    await client.query("COMMIT");
    res
      .status(201)
      .json({
        message: "Trip assigned successfully.",
        trip: tripResult.rows[0],
      });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error assigning trip:", error);
    res.status(500).json({ message: "Failed to assign trip." });
  } finally {
    client.release();
  }
});

// GET /api/company/trips - trips belonging to the current company
router.get("/trips", authorizeRole("owner", "manager"), async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) return res.json([]);

    const result = await pool.query(
      `
        SELECT t.trip_id, t.status, t.departure_time, t.arrival_time,
          t.cargo_type, t.notes, d.driver_id, d.full_name AS driver_name,
          v.vehicle_id, v.registration_no,
          COALESCE(r.origin, t.origin_address) AS origin,
          COALESCE(r.destination, t.destination_address) AS destination,
          r.route_name
        FROM Trip t
        JOIN Driver d ON d.driver_id = t.driver_id
        JOIN Vehicle v ON v.vehicle_id = t.vehicle_id
        LEFT JOIN Route r ON r.route_id = t.route_id
        WHERE t.owner_id = $1
        ORDER BY CASE t.status WHEN 'in_progress' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END,
          t.departure_time DESC
      `,
      [companyId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching company trips:", error);
    res.status(500).json({ message: "Failed to fetch trips." });
  }
});

// GET /api/company/managers - managers belonging to the current owner's company
router.get("/managers", authorizeRole("owner"), async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) {
      return res.json([]);
    }

    const result = await pool.query(
      `
        SELECT m.manager_id, m.full_name, m.employee_id, m.phone,
          m.department, u.username, u.email, u.is_active, u.created_at
        FROM Manager_Profile m
        JOIN User_Account u ON u.user_id = m.user_id
        WHERE m.owner_id = $1
        ORDER BY m.manager_id ASC, m.full_name ASC
      `,
      [companyId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Failed to fetch managers." });
  }
});

// GET /api/company/managers/:managerId - one manager in the owner's company
router.get("/managers/:managerId", authorizeRole("owner"), async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    const result = await pool.query(
      `
        SELECT m.manager_id, m.full_name, m.employee_id, m.phone,
          m.department, u.username, u.email, u.is_active, u.created_at
        FROM Manager_Profile m
        JOIN User_Account u ON u.user_id = m.user_id
        WHERE m.manager_id = $1 AND m.owner_id = $2
      `,
      [req.params.managerId, companyId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Manager not found or unauthorized." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching manager:", error);
    res.status(500).json({ message: "Failed to fetch manager." });
  }
});

// DELETE /api/company/managers/:managerId - remove a manager from the company
router.delete(
  "/managers/:managerId",
  authorizeRole("owner"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const companyId = await getCompanyId(req.user.user_id);
      const managerResult = await client.query(
        `SELECT user_id
         FROM Manager_Profile
         WHERE manager_id = $1 AND owner_id = $2
         FOR UPDATE`,
        [req.params.managerId, companyId],
      );

      if (managerResult.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Manager not found in your company." });
      }

      const userId = managerResult.rows[0].user_id;
      await client.query(
        `DELETE FROM Company_Request
         WHERE requester_user_id = $1 AND status IN ('pending', 'approved')`,
        [userId],
      );
      await client.query(
        `UPDATE Manager_Profile
         SET owner_id = NULL
         WHERE manager_id = $1 AND owner_id = $2`,
        [req.params.managerId, companyId],
      );

      await client.query("COMMIT");
      res.json({ message: "Manager terminated and released from the company." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error terminating manager:", error);
      res.status(500).json({ message: "Failed to terminate manager." });
    } finally {
      client.release();
    }
  },
);

// GET /api/company/alerts - company-wide alert list
router.get("/alerts", authorizeRole("owner", "manager"), async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) {
      return res.json([]);
    }

    await ensureSystemAlertTable();
    await upsertCompanyAlerts(companyId);
    const result = await pool.query(
      `
        SELECT *,
               CASE
                 WHEN resolved THEN 'resolved'
                 WHEN deadline IS NOT NULL AND deadline < NOW() THEN 'deadline expired'
                 ELSE 'needs to be resolved'
               END AS status
        FROM System_Alert
        WHERE owner_id = $1
        ORDER BY resolved ASC, created_at DESC
      `,
      [companyId],
    );

    const rows = result.rows.map((row) => ({
      ...row,
      alert_id: row.alert_id,
      alert_type: row.alert_type,
      title: row.title,
      about: row.about,
      description: row.description,
      created_at: row.created_at,
      deadline: row.deadline,
      status: normalizeAlertStatus(row),
    }));

    res.json(rows);
  } catch (error) {
    console.error("Error fetching company alerts:", error);
    res.status(500).json({ message: "No Alerts to show." });
  }
});

router.get(
  "/alerts/:alertType/:alertId",
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const companyId = await getCompanyId(req.user.user_id);
      if (!companyId) {
        return res
          .status(403)
          .json({ message: "Company membership required." });
      }

      await ensureSystemAlertTable();
      const result = await pool.query(
        `
        SELECT *
        FROM System_Alert
        WHERE owner_id = $1
          AND alert_type = $2
          AND alert_id = $3
      `,
        [companyId, req.params.alertType, Number(req.params.alertId)],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Alert not found." });
      }

      const row = result.rows[0];
      res.json({
        ...row,
        status: normalizeAlertStatus(row),
        alert_id: row.alert_id,
        alert_type: row.alert_type,
      });
    } catch (error) {
      console.error("Error fetching alert detail:", error);
      res.status(500).json({ message: "Failed to fetch alert detail." });
    }
  },
);

router.post(
  "/alerts/:alertType/:alertId/resolve",
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const companyId = await getCompanyId(req.user.user_id);
      if (!companyId) {
        return res
          .status(403)
          .json({ message: "Company membership required." });
      }

      await ensureSystemAlertTable();
      const result = await pool.query(
        `
        UPDATE System_Alert
        SET resolved = TRUE, resolved_at = NOW()
        WHERE owner_id = $1
          AND alert_type = $2
          AND alert_id = $3
          AND resolved = FALSE
        RETURNING *
      `,
        [companyId, req.params.alertType, Number(req.params.alertId)],
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Alert not found or already resolved." });
      }

      res.json({ message: "Alert marked as resolved.", alert: result.rows[0] });
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ message: "Failed to resolve alert." });
    }
  },
);

router.delete(
  "/alerts/:alertType/:alertId",
  authorizeRole("owner", "manager"),
  async (req, res) => {
    const companyId = await getCompanyId(req.user.user_id);
    if (!companyId) {
      return res
        .status(403)
        .json({ message: "Company membership required." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `
          DELETE FROM System_Alert
          WHERE owner_id = $1 AND alert_type = $2 AND alert_id = $3
          RETURNING reference_type, reference_id
        `,
        [companyId, req.params.alertType, Number(req.params.alertId)],
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Alert not found." });
      }

      // DO NOT delete from Fuel_Log when dismissing an alert; this would destroy accounting data.

      await client.query("COMMIT");
      res.json({ message: "Alert deleted." });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error deleting company alert:", error);
      res.status(500).json({ message: "Failed to delete alert." });
    } finally {
      client.release();
    }
  },
);

// GET /api/company/companies - companies available to join
router.get("/companies", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT o.owner_id, o.company_name, u.username AS owner_username
        FROM Owner_Profile o
        JOIN User_Account u ON u.user_id = o.user_id
        WHERE o.user_id <> $1
        ORDER BY o.company_name NULLS LAST, o.owner_id
      `,
      [req.user.user_id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
});

// POST /api/company/requests - request membership in a company
router.post(
  "/requests",
  authorizeRole("manager", "driver"),
  async (req, res) => {
    const { owner_id, owner_ids, message } = req.body;
    const requestedRole = req.user.role;
    const ownerIds = Array.isArray(owner_ids)
      ? owner_ids.map(Number).filter(Number.isInteger)
      : owner_id
        ? [Number(owner_id)]
        : [];

    if (ownerIds.length !== 1) {
      return res
        .status(400)
        .json({ message: "Choose exactly one company per request." });
    }

    if (requestedRole === "driver") {
      const documentCheck = await pool.query(
        `SELECT 1
         FROM Driver d
         JOIN Driver_Document dd ON dd.driver_id = d.driver_id
         WHERE d.user_id = $1
           AND dd.document_type = 'driving_license'
           AND dd.document_no IS NOT NULL
           AND dd.issue_date IS NOT NULL
           AND dd.expiry_date IS NOT NULL
           AND dd.document_url IS NOT NULL
         LIMIT 1`,
        [req.user.user_id],
      );
      if (documentCheck.rowCount === 0) {
        return res
          .status(403)
          .json({
            message:
              "Add a complete driver document before requesting a company.",
          });
      }
    }

    const uniqueOwnerIds = [...new Set(ownerIds)];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const companies = await client.query(
        "SELECT owner_id FROM Owner_Profile WHERE owner_id = ANY($1::int[])",
        [uniqueOwnerIds],
      );
      if (companies.rowCount !== uniqueOwnerIds.length) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ message: "One or more companies were not found." });
      }

      const existing = await client.query(
        `
          SELECT request_id FROM Company_Request
          WHERE requester_user_id = $1 AND status IN ('pending', 'approved')
        `,
        [req.user.user_id],
      );
      if (existing.rowCount > 0) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({
            message: "You already have a pending or approved company request.",
          });
      }

      const result = await client.query(
        `
          INSERT INTO Company_Request (requester_user_id, owner_id, requested_role, message)
          SELECT $1, company.owner_id, $3, $4
          FROM Owner_Profile company
          WHERE company.owner_id = $2
          RETURNING request_id, owner_id, requested_role, message, status, created_at
        `,
        [req.user.user_id, uniqueOwnerIds[0], requestedRole, message || null],
      );

      await client.query("COMMIT");
      res.status(201).json({ requests: result.rows });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating company request:", error);
      res.status(500).json({ message: "Failed to create company request." });
    } finally {
      client.release();
    }
  },
);

// GET /api/company/requests/mine
router.get("/requests/mine", async (req, res) => {
  try {
    const result = await pool.query(
      `
         SELECT r.*, o.company_name,
           owner.username AS owner_username, owner.email AS owner_email
        FROM Company_Request r
        JOIN Owner_Profile o ON o.owner_id = r.owner_id
         JOIN User_Account owner ON owner.user_id = o.user_id
        WHERE r.requester_user_id = $1
        ORDER BY r.created_at DESC
      `,
      [req.user.user_id],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching own requests:", error);
    res.status(500).json({ message: "Failed to fetch requests." });
  }
});

// DELETE /api/company/requests/:requestId - cancel an own pending request
router.delete(
  "/requests/:requestId",
  authorizeRole("manager", "driver"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          DELETE FROM Company_Request
          WHERE request_id = $1
            AND requester_user_id = $2
            AND status = 'pending'
          RETURNING request_id
        `,
        [req.params.requestId, req.user.user_id],
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pending request not found." });
      }
      res.json({ message: "Request cancelled." });
    } catch (error) {
      console.error("Error cancelling company request:", error);
      res.status(500).json({ message: "Failed to cancel request." });
    }
  },
);

// GET /api/company/requests/pending - requests awaiting this user's decision
router.get(
  "/requests/pending",
  authorizeRole("owner", "manager"),
  async (req, res) => {
    try {
      const companyId = await getCompanyId(req.user.user_id);
      if (!companyId) {
        return res.json([]);
      }

      const result = await pool.query(
        `
             SELECT r.request_id, r.requester_user_id, r.requested_role,
               r.message, r.created_at, u.username, u.email,
               COALESCE(d.full_name, m.full_name) AS full_name,
               COALESCE(d.phone, m.phone) AS phone,
               COALESCE(d.driver_id, m.manager_id) AS profile_id,
               m.employee_id, m.department,
               o.company_name
          FROM Company_Request r
          JOIN User_Account u ON u.user_id = r.requester_user_id
             JOIN Owner_Profile o ON o.owner_id = r.owner_id
          LEFT JOIN Driver d ON d.user_id = u.user_id
          LEFT JOIN Manager_Profile m ON m.user_id = u.user_id
          WHERE r.owner_id = $1
            AND r.status = 'pending'
            AND ($2 = 'owner' OR r.requested_role = 'driver')
          ORDER BY r.created_at ASC
        `,
        [companyId, req.user.role],
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests." });
    }
  },
);

const decideRequest = async (req, res, decision) => {
  const companyId = await getCompanyId(req.user.user_id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `
        SELECT * FROM Company_Request
        WHERE request_id = $1 AND status = 'pending'
        FOR UPDATE
      `,
      [req.params.requestId],
    );
    const request = requestResult.rows[0];

    if (!request || request.owner_id !== companyId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Pending request not found." });
    }

    const canDecide =
      req.user.role === "owner" ||
      (req.user.role === "manager" && request.requested_role === "driver");
    if (!canDecide) {
      await client.query("ROLLBACK");
      return res
        .status(403)
        .json({ message: "You cannot decide this request." });
    }

    await client.query(
      `
        UPDATE Company_Request
        SET status = $1, decided_by = $2, decided_at = CURRENT_TIMESTAMP
        WHERE request_id = $3
      `,
      [decision, req.user.user_id, request.request_id],
    );

    if (decision === "approved") {
      if (request.requested_role === "driver") {
        await client.query(
          "UPDATE Driver SET owner_id = $1 WHERE user_id = $2",
          [request.owner_id, request.requester_user_id],
        );
      } else {
        await client.query(
          "UPDATE Manager_Profile SET owner_id = $1 WHERE user_id = $2",
          [request.owner_id, request.requester_user_id],
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: `Request ${decision}.` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`Error deciding company request:`, error);
    res.status(500).json({ message: "Failed to decide request." });
  } finally {
    client.release();
  }
};

router.post(
  "/requests/:requestId/approve",
  authorizeRole("owner", "manager"),
  (req, res) => decideRequest(req, res, "approved"),
);
router.post(
  "/requests/:requestId/reject",
  authorizeRole("owner", "manager"),
  (req, res) => decideRequest(req, res, "rejected"),
);

module.exports = router;
