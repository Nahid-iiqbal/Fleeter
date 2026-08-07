const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/dashboard", require("./routes/dashboard"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Fleeter server listening on port ${PORT}`);
});
