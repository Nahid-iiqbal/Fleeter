const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Adjust path if your db.js is located elsewhere
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/admin/roster
router.get('/roster', verifyToken, async (req, res) => {
  try {
    // Ensure the requester is an admin
    const adminCheck = await pool.query('SELECT role FROM User_Account WHERE user_id = $1', [req.user.user_id]);

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'UnverifyTokenorized. Site Admins only.' });
    }

    const rosterQuery = await pool.query(`
      SELECT
        u.user_id, u.username, u.email, u.role, u.created_at,
        o.company_name,
        d.full_name AS driver_name, d.status AS driver_status
      FROM User_Account u
      LEFT JOIN Owner_Profile o ON u.user_id = o.user_id
      LEFT JOIN Driver d ON u.user_id = d.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(rosterQuery.rows);
  } catch (error) {
    console.error('Error fetching universal roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster.' });
  }
});

// Export the router so server.js can use it
module.exports = router;
