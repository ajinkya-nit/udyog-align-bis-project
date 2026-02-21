require('dotenv').config();
const express = require('express');
const cors = require('cors');

const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Udyog Align Backend - Local DB Mode' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('📦 Using Local JSON Database (LowDB)');
});
