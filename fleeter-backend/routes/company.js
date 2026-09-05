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
      return res.status(400).json({ message: "Choose exactly one company per request." });
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
        return res.status(404).json({ message: "One or more companies were not found." });
      }

      const existing = await client.query(
        `
          SELECT request_id FROM Company_Request
          WHERE requester_user_id = $1 AND status = 'pending'
        `,
        [req.user.user_id],
      );
      if (existing.rowCount > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Cancel your current pending request before requesting another company." });
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const companyId = await getCompanyId(req.user.user_id);
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
      return res.status(403).json({ message: "You cannot decide this request." });
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
