const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Adjust path if your db.js is located elsewhere
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/admin/roster
router.get("/roster", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized. Site Admins only." });
    }

    const rosterQuery = await pool.query(`
      SELECT
        u.user_id, u.username, u.email, u.role, u.created_at,
        o.company_name,
        d.full_name AS driver_name, d.status AS driver_status
      FROM User_Account u
      LEFT JOIN Owner_Profile o ON u.user_id = o.user_id
      LEFT JOIN Driver d ON u.user_id = d.user_id
      ORDER BY u.user_id ASC, u.created_at DESC
    `);

    res.json(rosterQuery.rows);
  } catch (error) {
    console.error("Error fetching universal roster:", error);
    res.status(500).json({ error: "Failed to fetch roster." });
  }
});

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized." });
    if (parseInt(req.params.userId) === req.user.user_id)
      return res.status(400).json({ error: "Cannot delete yourself." });
    await pool.query("DELETE FROM User_Account WHERE user_id = $1", [
      req.params.userId,
    ]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// PATCH /api/admin/users/:userId/role
router.patch("/users/:userId/role", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Unauthorized." });
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
