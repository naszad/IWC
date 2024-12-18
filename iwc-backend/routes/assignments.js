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

// Assign test to students
router.post('/', auth, isTeacher, async (req, res) => {
  const { testId, studentIds, dueDate } = req.body;

  try {
    await pool.query('BEGIN');

    // Verify test exists and belongs to the teacher
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    // Verify students exist and match the test level
    const studentsCheck = await pool.query(
      `SELECT s.student_id, s.level 
       FROM students s 
       WHERE s.student_id = ANY($1)`,
      [studentIds]
    );

    if (studentsCheck.rows.length !== studentIds.length) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'One or more students not found' });
    }

    // Create assignments
    const assignments = [];
    for (const studentId of studentIds) {
      try {
        const result = await pool.query(
          `INSERT INTO test_assignments 
           (test_id, student_id, teacher_id, due_date) 
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [testId, studentId, req.user.teacher_id, dueDate]
        );
        assignments.push(result.rows[0]);
      } catch (err) {
        // Skip if assignment already exists
        if (err.code === '23505') continue;
        throw err;
      }
    }

    await pool.query('COMMIT');
    res.status(201).json(assignments);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error assigning test:', error);
    res.status(500).json({ error: 'Server error while assigning test' });
  }
});

// Get assignments for a teacher
router.get('/teacher', auth, isTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ta.assignment_id,
        ta.test_id,
        ta.student_id,
        ta.teacher_id,
        ta.assigned_at,
        ta.due_date,
        ta.status,
        t.theme,
        t.level,
        u.full_name as student_name,
        s.language as student_language,
        COALESCE(st.score, 0) as score,
        st.attempt_date
      FROM test_assignments ta
      JOIN tests t ON ta.test_id = t.test_id
      JOIN students s ON ta.student_id = s.student_id
      JOIN users u ON s.student_id = u.id
      LEFT JOIN student_tests st ON ta.test_id = st.test_id AND ta.student_id = st.student_id
      WHERE ta.teacher_id = $1
      ORDER BY ta.assigned_at DESC`,
      [req.user.teacher_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// Update assignment status
router.put('/:assignmentId', auth, isTeacher, async (req, res) => {
  const { status } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE test_assignments 
       SET status = $1
       WHERE assignment_id = $2 AND teacher_id = $3
       RETURNING *`,
      [status, req.params.assignmentId, req.user.teacher_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Server error while updating assignment' });
  }
});

// Delete assignment
router.delete('/:assignmentId', auth, isTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM test_assignments WHERE assignment_id = $1 AND teacher_id = $2 RETURNING *',
      [req.params.assignmentId, req.user.teacher_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found or unauthorized' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Server error while deleting assignment' });
  }
});

// Get assignments for a student
router.get('/student', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        ta.assignment_id,
        ta.test_id,
        t.theme,
        t.level,
        ta.assigned_at,
        ta.due_date,
        ta.status,
        st.score,
        st.attempt_date
      FROM test_assignments ta
      JOIN tests t ON ta.test_id = t.test_id
      LEFT JOIN student_tests st ON ta.test_id = st.test_id AND ta.student_id = st.student_id
      WHERE ta.student_id = $1
      ORDER BY ta.assigned_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

module.exports = router;