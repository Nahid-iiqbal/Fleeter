const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/fleeter/auth', require('./routes/auth'));
app.use('/api/fleeter/tracking', require('./routes/tracking'));
// Add routes for /vehicles and /analytics as you build them out!

app.get('/', (req, res) => {
  res.send('Fleeter API Engine is running smoothly.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Fleeter server listening on port ${PORT}`);
});