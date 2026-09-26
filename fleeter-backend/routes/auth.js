const router = require("express").Router();
const bcrypt = require("bcrypt");
const upload = require("../middleware/upload");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const { verifyToken } = require("../middleware/authMiddleware");

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 10 attempts per IP per window
  message: { error: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

let profilePictureColumnPromise;
const ensureProfilePictureColumn = () => {
  if (!profilePictureColumnPromise) {
    profilePictureColumnPromise = db.query(
      "ALTER TABLE User_Account ADD COLUMN IF NOT EXISTS profile_picture_url TEXT",
    );
  }
  return profilePictureColumnPromise;
};

// POST /api/fleeter/auth/login
router.post("/login", authLimiter, async (req, res) => {
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

    if (!user.is_active) {
      return res
        .status(403)
        .json({ error: "This account has been deactivated." });
    }
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
    if (!process.env.JWT_SECRET) {
      console.error("FATAL: JWT_SECRET is not set.");
      return res.status(500).json({ error: "Server misconfiguration." });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "12h" },
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user_id: user.user_id,
      username: user.username,
      theme: user.theme || "light",
      notifications_enabled: user.notifications_enabled,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/fleeter/auth/register
router.post("/register", authLimiter, async (req, res) => {
  const { firstName, lastName, username, email, password, role } = req.body;

  const ALLOWED_USER_ROLES = ["driver", "owner", "manager"];
  const registeredRole = ALLOWED_USER_ROLES.includes(role) ? role : "driver";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (!firstName?.trim() || !lastName?.trim()) {
    return res
      .status(400)
      .json({ error: "First name and last name are required." });
  }
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
      "INSERT INTO User_Account (username, email, password_hash, role, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, email, role",
      [username, email, passwordHash, registeredRole, fullName],
    );

    if (registeredRole === "owner") {
      await db.query("INSERT INTO Owner_Profile (user_id) VALUES ($1)", [
        newUser.rows[0].user_id,
      ]);
    } else if (registeredRole === "manager") {
      await db.query(
        "INSERT INTO Manager_Profile (user_id, full_name) VALUES ($1, $2)",
        [newUser.rows[0].user_id, fullName],
      );
    } else if (registeredRole === "driver") {
      await db.query(
        "INSERT INTO Driver (user_id, full_name, joined_date) VALUES ($1, $2, CURRENT_DATE)",
        [newUser.rows[0].user_id, fullName],
      );
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

    await db.query(
      "INSERT INTO Token_Blacklist (token, expires_at) VALUES ($1, $2)",
      [token, expiresAt],
    );

    db.query(
      "DELETE FROM Token_Blacklist WHERE expires_at < CURRENT_TIMESTAMP",
    ).catch((err) => console.error("Token cleanup error:", err));

    res.status(200).json({ message: "Successfully logged out." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout." });
  }
});

// GET /api/auth/account
router.get("/account", verifyToken, async (req, res) => {
  try {
    await ensureProfilePictureColumn();
    const userQuery = await db.query(
      `SELECT u.username, u.email,
        COALESCE(d.full_name, m.full_name, u.full_name) AS full_name,
        COALESCE(d.phone, m.phone, u.phone) AS phone, u.address, u.profile_picture_url,
        u.theme, u.notifications_enabled, u.role, o.company_name
       FROM User_Account u
       LEFT JOIN Owner_Profile o ON u.user_id = o.user_id
       LEFT JOIN Driver d ON u.user_id = d.user_id
       LEFT JOIN Manager_Profile m ON u.user_id = m.user_id
       WHERE u.user_id = $1`,
      [req.user.user_id],
    );
    if (userQuery.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(userQuery.rows[0]);
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Failed to fetch account." });
  }
});

// PUT /api/auth/account/profile-picture
router.put(
  "/account/profile-picture",
  verifyToken,
  upload.single("profile_picture"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "A profile picture is required." });
    }

    try {
      await ensureProfilePictureColumn();
      const previousPicture = await db.query(
        "SELECT profile_picture_url FROM User_Account WHERE user_id = $1",
        [req.user.user_id],
      );
      const previousPictureUrl = previousPicture.rows[0]?.profile_picture_url;
      const profilePictureUrl = `/uploads/${req.file.filename}`;
      await db.query(
        "UPDATE User_Account SET profile_picture_url = $1 WHERE user_id = $2",
        [profilePictureUrl, req.user.user_id],
      );

      if (previousPictureUrl?.startsWith("/uploads/")) {
        const previousPicturePath = path.join(
          __dirname,
          "..",
          previousPictureUrl,
        );
        await fs.promises.unlink(previousPicturePath).catch((unlinkError) => {
          if (unlinkError.code !== "ENOENT") {
            console.warn("Could not delete previous profile picture:", unlinkError);
          }
        });
      }

      res.json({ profile_picture_url: profilePictureUrl });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture." });
    }
  },
);

// DELETE /api/auth/account/profile-picture
router.delete(
  "/account/profile-picture",
  verifyToken,
  async (req, res) => {
    try {
      await ensureProfilePictureColumn();
      const previousPicture = await db.query(
        "SELECT profile_picture_url FROM User_Account WHERE user_id = $1",
        [req.user.user_id],
      );
      const previousPictureUrl = previousPicture.rows[0]?.profile_picture_url;

      await db.query(
        "UPDATE User_Account SET profile_picture_url = NULL WHERE user_id = $1",
        [req.user.user_id],
      );

      if (previousPictureUrl?.startsWith("/uploads/")) {
        const previousPicturePath = path.join(
          __dirname,
          "..",
          previousPictureUrl,
        );
        await fs.promises.unlink(previousPicturePath).catch((unlinkError) => {
          if (unlinkError.code !== "ENOENT") {
            console.warn("Could not delete profile picture:", unlinkError);
          }
        });
      }

      res.json({ message: "Profile picture deleted." });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      res.status(500).json({ error: "Failed to delete profile picture." });
    }
  },
);

// PATCH /api/auth/settings (partial update for theme and notifications)
router.patch("/settings", verifyToken, async (req, res) => {
  const { theme, notifications_enabled } = req.body;
  try {
    const fields = [];
    const values = [];
    let queryIdx = 1;

    if (theme !== undefined) {
      fields.push(`theme = $${queryIdx++}`);
      values.push(theme);
    }
    if (notifications_enabled !== undefined) {
      fields.push(`notifications_enabled = $${queryIdx++}`);
      values.push(notifications_enabled);
    }

    if (fields.length === 0)
      return res.json({ message: "No settings to update" });

    values.push(req.user.user_id);
    const query = `UPDATE User_Account SET ${fields.join(", ")} WHERE user_id = $${queryIdx}`;

    await db.query(query, values);
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings." });
  }
});
// PUT /api/auth/account
router.put("/account", verifyToken, async (req, res) => {
  const {
    username,
    email,
    full_name,
    phone,
    address,
    password,
    theme,
    notifications_enabled,
    company_name,
  } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required." });
  }

  try {
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await db.query(
        "UPDATE User_Account SET username = $1, email = $2, full_name = $3, phone = $4, address = $5, password_hash = $6, theme = $7, notifications_enabled = $8 WHERE user_id = $9",
        [
          username,
          email,
          full_name || null,
          phone || null,
          address || null,
          password_hash,
          theme || "light",
          notifications_enabled !== false,
          req.user.user_id,
        ],
      );
    } else {
      await db.query(
        "UPDATE User_Account SET username = $1, email = $2, full_name = $3, phone = $4, address = $5, theme = $6, notifications_enabled = $7 WHERE user_id = $8",
        [
          username,
          email,
          full_name || null,
          phone || null,
          address || null,
          theme || "light",
          notifications_enabled !== false,
          req.user.user_id,
        ],
      );
    }
    if (req.user.role === "driver") {
      await db.query(
        "UPDATE Driver SET full_name = $1, phone = $2 WHERE user_id = $3",
        [full_name || null, phone || null, req.user.user_id],
      );
    }
    if (req.user.role === "manager") {
      await db.query(
        "UPDATE Manager_Profile SET full_name = $1, phone = $2 WHERE user_id = $3",
        [full_name || null, phone || null, req.user.user_id],
      );
    }
    if (req.user.role === "owner" && company_name !== undefined) {
      await db.query(
        "UPDATE Owner_Profile SET company_name = $1 WHERE user_id = $2",
        [company_name || null, req.user.user_id],
      );
    }
    res.json({
      message: "Account updated successfully",
      theme,
      notifications_enabled,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email is already taken." });
    }
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Failed to update account." });
  }
});

module.exports = router;
