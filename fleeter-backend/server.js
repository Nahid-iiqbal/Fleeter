const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Ensure uploads folder exists so static serving doesn't fail
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Format allowed origins (strips trailing slashes to prevent CORS mismatches)
const cleanOrigin = (url) => (url ? url.replace(/\/+$/, "") : url);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  cleanOrigin(process.env.FRONTEND_URL),
].filter(Boolean);

// Configure Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Configure CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman or mobile apps)
      if (!origin || allowedOrigins.includes(cleanOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// Serve uploads statically
app.use("/uploads", express.static(uploadsDir));

// Health check route - test this directly in your browser
app.get("/", (req, res) => {
  res.status(200).json({ status: "OK", message: "Fleeter server is up and running!" });
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/drivers", require("./routes/driversList"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/driver", require("./routes/driver"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/company", require("./routes/company"));
app.use("/api/messages", require("./routes/messages"));

// Global Error Handler (prevents server crashes on unhandled route errors)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Fleeter server listening on port ${PORT}`);
});
