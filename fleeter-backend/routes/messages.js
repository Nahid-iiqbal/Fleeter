const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");

// Get eligible users to message (same company)
router.get("/users", verifyToken, async (req, res) => {
  try {
    const { user_id: userId, role } = req.user;
    let ownerId = null;

    if (role === 'admin') {
      const result = await pool.query("SELECT user_id, username, role FROM User_Account WHERE is_active = TRUE AND user_id != $1", [userId]);
      return res.json({ users: result.rows });
    } else if (role === 'owner') {
      const resOwner = await pool.query("SELECT owner_id FROM Owner_Profile WHERE user_id = $1", [userId]);
      if (resOwner.rows.length > 0) ownerId = resOwner.rows[0].owner_id;
    } else if (role === 'manager') {
      const resManager = await pool.query("SELECT m.owner_id FROM Manager_Profile m JOIN User_Account u ON m.user_id = u.user_id WHERE u.user_id = $1", [userId]);
      if (resManager.rows.length > 0) ownerId = resManager.rows[0].owner_id;
    } else if (role === 'driver') {
      const resDriver = await pool.query("SELECT d.owner_id FROM Driver d JOIN User_Account u ON d.user_id = u.user_id WHERE u.user_id = $1", [userId]);
      if (resDriver.rows.length > 0) ownerId = resDriver.rows[0].owner_id;
    }

    if (!ownerId) {
      return res.json({ users: [] }); 
    }

    const result = await pool.query(`
      SELECT user_id, username, role 
      FROM User_Account 
      WHERE is_active = TRUE 
        AND user_id != $2
        AND (
          user_id = (SELECT user_id FROM Owner_Profile WHERE owner_id = $1)
          OR user_id IN (SELECT u.user_id FROM Manager_Profile m JOIN User_Account u ON m.user_id = u.user_id WHERE m.owner_id = $1)
          OR user_id IN (SELECT u.user_id FROM Driver d JOIN User_Account u ON d.user_id = u.user_id WHERE d.owner_id = $1)
        )
      ORDER BY role, username
    `, [ownerId, userId]);

    res.json({ users: result.rows });
  } catch (error) {
    console.error("Fetch message users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get all messages for the logged-in user
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(`
      SELECT m.message_id, m.sender_id, u.username as sender_username, u.role as sender_role, m.content, m.sent_at, m.is_read
      FROM Message m
      JOIN User_Account u ON m.sender_id = u.user_id
      WHERE m.receiver_id = $1
      ORDER BY m.sent_at DESC
    `, [userId]);
    res.json({ messages: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Mark as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    await pool.query("UPDATE Message SET is_read = TRUE WHERE message_id = $1 AND receiver_id = $2", [req.params.id, req.user.user_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Delete a message
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM Message WHERE message_id = $1 AND receiver_id = $2", [req.params.id, req.user.user_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Send a message
router.post("/", verifyToken, async (req, res) => {
  try {
    const senderId = req.user.user_id;
    const { role } = req.user;
    const { receiver_username, content } = req.body;
    if (!receiver_username || !content) return res.status(400).json({ error: "Missing fields" });

    // Restrict to same company
    let ownerId = null;
    if (role === 'owner') {
      const resOwner = await pool.query("SELECT owner_id FROM Owner_Profile WHERE user_id = $1", [senderId]);
      if (resOwner.rows.length > 0) ownerId = resOwner.rows[0].owner_id;
    } else if (role === 'manager') {
      const resManager = await pool.query("SELECT m.owner_id FROM Manager_Profile m JOIN User_Account u ON m.user_id = u.user_id WHERE u.user_id = $1", [senderId]);
      if (resManager.rows.length > 0) ownerId = resManager.rows[0].owner_id;
    } else if (role === 'driver') {
      const resDriver = await pool.query("SELECT d.owner_id FROM Driver d JOIN User_Account u ON d.user_id = u.user_id WHERE u.user_id = $1", [senderId]);
      if (resDriver.rows.length > 0) ownerId = resDriver.rows[0].owner_id;
    }

    let userRes;
    if (role === 'admin') {
      userRes = await pool.query("SELECT user_id FROM User_Account WHERE username = $1 AND is_active = TRUE", [receiver_username]);
    } else {
      if (!ownerId) return res.status(403).json({ error: "Not part of a company" });
      userRes = await pool.query(`
        SELECT user_id 
        FROM User_Account 
        WHERE username = $2 AND is_active = TRUE 
          AND (
            user_id = (SELECT user_id FROM Owner_Profile WHERE owner_id = $1)
            OR user_id IN (SELECT u.user_id FROM Manager_Profile m JOIN User_Account u ON m.user_id = u.user_id WHERE m.owner_id = $1)
            OR user_id IN (SELECT u.user_id FROM Driver d JOIN User_Account u ON d.user_id = u.user_id WHERE d.owner_id = $1)
          )
      `, [ownerId, receiver_username]);
    }

    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found or not in your company" });
    const receiverId = userRes.rows[0].user_id;

    await pool.query(
      "INSERT INTO Message (sender_id, receiver_id, content) VALUES ($1, $2, $3)",
      [senderId, receiverId, content]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
