const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const userResult = await pool.query(
      'SELECT id, username, full_name, role FROM users WHERE id = $1',
      [verified.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    if (user.role === 'teacher') {
      const teacherResult = await pool.query(
        'SELECT teacher_id FROM teachers WHERE teacher_id = $1',
        [user.id]
      );
      if (teacherResult.rows.length > 0) {
        user.teacher_id = teacherResult.rows[0].teacher_id;
      }
    } else if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT student_id, level FROM students WHERE student_id = $1',
        [user.id]
      );
      if (studentResult.rows.length > 0) {
        user.student_id = studentResult.rows[0].student_id;
        user.level = studentResult.rows[0].level;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = authenticateToken; 