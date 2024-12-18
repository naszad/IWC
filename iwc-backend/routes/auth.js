// backend/routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get role-specific data
    let roleData = {};
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT student_id, language, level FROM students WHERE student_id = $1',
        [user.id]
      );
      roleData = studentResult.rows[0];
    } else if (user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT teacher_id, email FROM teachers WHERE teacher_id = $1',
        [user.id]
      );
      roleData = teacherResult.rows[0];
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { hashed_password, ...userData } = user;
    res.json({
      token,
      user: {
        ...userData,
        ...roleData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Register student route
router.post('/register/student', async (req, res) => {
  const { username, password, full_name, language, level } = req.body;

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashed_password = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (username, hashed_password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashed_password, full_name, 'student']
    );

    const user = userResult.rows[0];

    // Create student
    const studentResult = await pool.query(
      'INSERT INTO students (student_id, language, level) VALUES ($1, $2, $3) RETURNING *',
      [user.id, language, level]
    );

    await pool.query('COMMIT');

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data
    const { hashed_password: _, ...userData } = user;
    res.status(201).json({
      token,
      user: {
        ...userData,
        ...studentResult.rows[0]
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Student registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Register teacher route
router.post('/register/teacher', async (req, res) => {
  const { username, password, full_name, email } = req.body;

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashed_password = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (username, hashed_password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashed_password, full_name, 'teacher']
    );

    const user = userResult.rows[0];

    // Create teacher
    const teacherResult = await pool.query(
      'INSERT INTO teachers (teacher_id, email) VALUES ($1, $2) RETURNING *',
      [user.id, email]
    );

    await pool.query('COMMIT');

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: 'teacher' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data
    const { hashed_password: _, ...userData } = user;
    res.status(201).json({
      token,
      user: {
        ...userData,
        ...teacherResult.rows[0]
      }
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Teacher registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, full_name, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    let roleData = {};
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT student_id, language, level FROM students WHERE student_id = $1',
        [user.id]
      );
      roleData = studentResult.rows[0];
    } else if (user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT teacher_id, email FROM teachers WHERE teacher_id = $1',
        [user.id]
      );
      roleData = teacherResult.rows[0];
    }

    res.json({
      user: {
        ...user,
        ...roleData
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error while fetching user data' });
  }
});

module.exports = router;
