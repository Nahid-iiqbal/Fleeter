const jwt = require("jsonwebtoken");

const verifyTokenAndRole = (allowedRoles) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access Denied: No token provided" });
    }

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified; // Payload contains user_id and role

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Inadequate permissions" });
      }

      next();
    } catch (err) {
      res.status(400).json({ error: "Invalid or expired token" });
    }
  };
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden. You do not have permission to perform this action.",
      });
    }
    next();
  };
};

module.exports = { verifyTokenAndRole };
