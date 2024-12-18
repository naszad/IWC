const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

// Middleware to check if user is a teacher
const isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Teachers only.' });
  }
  if (!req.user.teacher_id) {
    return res.status(403).json({ error: 'Teacher ID not found.' });
  }
  next();
};

// Get all students for a teacher (students who have taken their tests)
router.get('/teacher-students', auth, isTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT 
        s.student_id,
        u.full_name,
        s.language,
        s.level,
        u.created_at,
        COUNT(DISTINCT st.test_id) as tests_taken,
        AVG(st.score) as average_score
      FROM students s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN student_tests st ON s.student_id = st.student_id
      LEFT JOIN tests t ON st.test_id = t.test_id
      WHERE t.teacher_id = $1 OR t.teacher_id IS NULL
      GROUP BY s.student_id, u.full_name, s.language, s.level, u.created_at
      ORDER BY u.full_name`,
      [req.user.teacher_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    res.status(500).json({ error: 'Server error while fetching students' });
  }
});

// Get detailed student progress
router.get('/student-progress/:studentId', auth, isTeacher, async (req, res) => {
  try {
    // Get student details and test history
    const result = await pool.query(
      `SELECT 
        u.full_name,
        s.language,
        s.level,
        t.theme as test_name,
        st.score,
        st.attempt_date,
        COUNT(a.answer_id) as total_questions,
        SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as correct_answers
      FROM students s
      JOIN users u ON s.student_id = u.id
      LEFT JOIN student_tests st ON s.student_id = st.student_id
      LEFT JOIN tests t ON st.test_id = t.test_id
      LEFT JOIN answers a ON st.student_test_id = a.student_test_id
      WHERE s.student_id = $1 AND (t.teacher_id = $2 OR t.teacher_id IS NULL)
      GROUP BY u.full_name, s.language, s.level, t.theme, st.score, st.attempt_date
      ORDER BY st.attempt_date DESC`,
      [req.params.studentId, req.user.teacher_id]
    );

    if (result.rows.length === 0) {
      // Check if student exists
      const studentCheck = await pool.query(
        'SELECT * FROM students s JOIN users u ON s.student_id = u.id WHERE s.student_id = $1',
        [req.params.studentId]
      );

      if (studentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      // Return empty progress for existing student
      return res.json([{
        full_name: studentCheck.rows[0].full_name,
        language: studentCheck.rows[0].language,
        level: studentCheck.rows[0].level,
        test_name: null,
        score: null,
        attempt_date: null,
        total_questions: 0,
        correct_answers: 0
      }]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Server error while fetching student progress' });
  }
});

module.exports = router; 