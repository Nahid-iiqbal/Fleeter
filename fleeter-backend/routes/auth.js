const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// POST /api/fleeter/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Fetch user by email
    const userQuery = await db.query(
      "SELECT * FROM User_Account WHERE email = $1",
      [email],
    );
    if (userQuery.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = userQuery.rows[0];

    // 2. Compare password against hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Sign JWT Token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "12h" },
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user_id: user.user_id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // 1. Check if the user already exists
    const userExists = await pool.query(
      "SELECT * FROM User_Account WHERE email = $1",
      [email],
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // 2. Hash the password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO User_Account (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role",
      [email, passwordHash, role || "driver"],
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
});

module.exports = router;
