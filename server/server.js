const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const messageRoutes = require('./routes/messages');

// Initialize Express app
const app = express();

// Configure CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// API routes
app.use('/api/messages', messageRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Log API requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Set port and start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AI Sign Language Chat Server running on port ${PORT}`);
});