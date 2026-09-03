const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/fleeter/auth/login
router.post("/login", async (req, res) => {
  // Use 'identifier' to represent either the email or the username
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ error: "Please provide a valid username/email and password" });
  }

  try {
    // 1. Fetch user by email OR username
    const userQuery = await db.query(
      "SELECT * FROM User_Account WHERE email = $1 OR username = $1",
      [identifier],
    );

    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = userQuery.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 3. Update last_login timestamp
    await db.query(
      "UPDATE User_Account SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1",
      [user.user_id],
    );

    // 4. Sign JWT Token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        username: user.username,
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "12h" },
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user_id: user.user_id,
      username: user.username,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/fleeter/auth/register
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    // 1. Check if the user (email or username) already exists
    const userExists = await db.query(
      "SELECT * FROM User_Account WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Email or Username already in use" });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database
    const newUser = await db.query(
      "INSERT INTO User_Account (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role",
      [username, email, passwordHash, role || "driver"],
    );

    // 4. (Optional but Recommended) Auto-create Owner_Profile if role is owner
    if (role === "owner") {
      await db.query("INSERT INTO Owner_Profile (user_id) VALUES ($1)", [
        newUser.rows[0].user_id,
      ]);
    }

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
});

router.post("/logout", verifyToken, async (req, res) => {
  try {
    const token = req.token;

    const expiresAt = new Date(req.user.exp * 1000);

    await pool.query(
      "INSERT INTO Token_Blacklist (token, expires_at) VALUES ($1, $2)",
      [token, expiresAt],
    );
    pool
      .query("DELETE FROM Token_Blacklist WHERE expires_at < CURRENT_TIMESTAMP")
      .catch((err) => console.error("Token cleanup error:", err));
    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout." });
  }
});

module.exports = router;
