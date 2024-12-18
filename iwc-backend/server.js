const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const initDb = require('./db/init');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const mediaRoutes = require('./routes/media');
const studentRoutes = require('./routes/students');
const assignmentRoutes = require('./routes/assignments');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/assignments', assignmentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDb();
    console.log('Database initialized successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
