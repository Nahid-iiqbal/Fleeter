const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Enable CORS for all requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/drivers", require("./routes/driversList"));
app.use("/api/vehicles", require("./routes/vehicles"));
app.use("/api/driver", require("./routes/driver"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/company", require("./routes/company"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Fleeter server listening on port ${PORT}`);
});
