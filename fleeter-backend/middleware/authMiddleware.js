const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // 1. Get the token from the request headers
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  // 2. Remove "Bearer " if it was included in the header
  const token = authHeader.replace("Bearer ", "");

  try {
    // 3. Verify the token using your secret key
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret",
    );

    // 4. Attach the decoded user data (like user_id and role) to the request
    req.user = decoded;

    // 5. Move on to the actual route handler
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};
