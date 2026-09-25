const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Adjust path if your db.js is located elsewhere
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");
const { deleteUploadFiles } = require("../utils/uploadFiles");

// GET /api/admin/roster
router.get("/roster", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    const rosterQuery = await pool.query(`
      SELECT
        u.user_id, u.username, u.email, u.role, u.created_at,
        COALESCE(o.company_name, mo.company_name) AS company_name,
        COALESCE(d.full_name, m.full_name) AS full_name,
        d.status AS driver_status
      FROM User_Account u
      LEFT JOIN Owner_Profile o ON u.user_id = o.user_id
      LEFT JOIN Driver d ON u.user_id = d.user_id
      LEFT JOIN Manager_Profile m ON u.user_id = m.user_id
      LEFT JOIN Owner_Profile mo ON m.owner_id = mo.owner_id
      ORDER BY u.user_id ASC, u.created_at DESC
    `);
    res.json(rosterQuery.rows);
  } catch (error) {
    console.error("Error fetching universal roster:", error);
    res.status(500).json({ error: "Failed to fetch roster." });
  }
});

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    
    if (parseInt(req.params.userId) === req.user.user_id)
      return res.status(400).json({ error: "Cannot delete yourself." });

    const uploadedFiles = await pool.query(
      `SELECT file_url
       FROM (
         SELECT profile_picture_url AS file_url
         FROM User_Account
         WHERE user_id = $1
         UNION ALL
         SELECT v.registration_document_url
         FROM Vehicle v
         JOIN Owner_Profile o ON o.owner_id = v.owner_id
         WHERE o.user_id = $1
         UNION ALL
         SELECT vd.document_url
         FROM Vehicle_Document vd
         JOIN Vehicle v ON v.vehicle_id = vd.vehicle_id
         JOIN Owner_Profile o ON o.owner_id = v.owner_id
         WHERE o.user_id = $1
         UNION ALL
         SELECT vi.image_url
         FROM Vehicle_Image vi
         JOIN Vehicle v ON v.vehicle_id = vi.vehicle_id
         JOIN Owner_Profile o ON o.owner_id = v.owner_id
         WHERE o.user_id = $1
         UNION ALL
         SELECT i.image_url
         FROM Incident i
         JOIN Trip t ON t.trip_id = i.trip_id
         JOIN Owner_Profile o ON o.owner_id = t.owner_id
         WHERE o.user_id = $1
         UNION ALL
         SELECT dd.document_url
         FROM Driver_Document dd
         JOIN Driver d ON d.driver_id = dd.driver_id
         WHERE d.user_id = $1
         UNION ALL
         SELECT i.image_url
         FROM Incident i
         JOIN Trip t ON t.trip_id = i.trip_id
         JOIN Driver d ON d.driver_id = t.driver_id
         WHERE d.user_id = $1
       ) uploaded_files
       WHERE file_url IS NOT NULL`,
      [req.params.userId],
    );

    await pool.query("DELETE FROM User_Account WHERE user_id = $1", [
      req.params.userId,
    ]);
    await deleteUploadFiles(uploadedFiles.rows.map((row) => row.file_url));
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// PATCH /api/admin/users/:userId/role
router.patch("/users/:userId/role", verifyToken, authorizeRole("admin"), async (req, res) => {
  try {
    
    if (parseInt(req.params.userId) === req.user.user_id)
      return res.status(400).json({ error: "Cannot change your own role." });
    await pool.query("UPDATE User_Account SET role = $1 WHERE user_id = $2", [
      req.body.role,
      req.params.userId,
    ]);
    res.json({ message: "User role updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user role." });
  }
});

// Export the router so server.js can use it

module.exports = router;
