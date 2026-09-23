const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const app = express();

// Enable CORS for all requests
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:3000"];

// Configure Helmet to allow cross-origin image loading
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// <-- Serve the uploads directory statically -->
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/drivers", require("./routes/driversList"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/driver", require("./routes/driver"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/company", require("./routes/company"));

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in .env");
  process.exit(1);
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Fleeter server listening on port ${PORT}`);
});
