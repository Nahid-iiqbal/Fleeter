const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    const blacklistCheck = await pool.query(
      "SELECT token FROM Token_Blacklist WHERE token = $1",
      [token],
    );

    if (blacklistCheck.rowCount > 0) {
      return res.status(401).json({ message: "Please log in again." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have the required permission." });
    }
    next();
  };
};


module.exports = { verifyToken, authorizeRole };
