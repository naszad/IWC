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

/*
 * Test Management Routes (Teacher Only)
 */

// Create a new test
router.post('/', auth, isTeacher, async (req, res) => {
  const { theme, level, questions } = req.body;

  try {
    await pool.query('BEGIN');

    const testResult = await pool.query(
      'INSERT INTO tests (theme, level, teacher_id) VALUES ($1, $2, $3) RETURNING *',
      [theme, level, req.user.teacher_id]
    );

    const test = testResult.rows[0];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      await pool.query(
        'INSERT INTO questions (test_id, possible_answers, correct_answer, question_order) VALUES ($1, $2, $3, $4)',
        [test.test_id, question.possible_answers, question.correct_answer, i + 1]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json(test);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error creating test:', error);
    res.status(500).json({ error: 'Server error while creating test' });
  }
});

// Update test
router.put('/:id', auth, isTeacher, async (req, res) => {
  const { theme, level } = req.body;
  const testId = req.params.id;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    const result = await pool.query(
      'UPDATE tests SET theme = $1, level = $2 WHERE test_id = $3 RETURNING *',
      [theme, level, testId]
    );

    const updatedTest = result.rows[0];
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1',
      [testId]
    );
    updatedTest.questions = questions.rows;

    res.json(updatedTest);
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ error: 'Server error while updating test' });
  }
});

// Delete test
router.delete('/:id', auth, isTeacher, async (req, res) => {
  const testId = req.params.id;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    await pool.query('BEGIN');
    await pool.query('DELETE FROM questions WHERE test_id = $1', [testId]);
    await pool.query('DELETE FROM student_tests WHERE test_id = $1', [testId]);
    await pool.query('DELETE FROM tests WHERE test_id = $1', [testId]);
    await pool.query('COMMIT');

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Server error while deleting test' });
  }
});

/*
 * Question Management Routes (Teacher Only)
 */

// Add a question to a test
router.post('/:testId/questions', auth, isTeacher, async (req, res) => {
  const testId = req.params.testId;
  const questionData = req.body;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    // Get the current max question_order
    const maxOrderResult = await pool.query(
      'SELECT COALESCE(MAX(question_order), 0) as max_order FROM questions WHERE test_id = $1',
      [testId]
    );
    const nextOrder = maxOrderResult.rows[0].max_order + 1;

    await pool.query(
      'INSERT INTO questions (test_id, possible_answers, correct_answer, question_order) VALUES ($1, $2, $3, $4)',
      [testId, questionData.possible_answers, questionData.correct_answer, nextOrder]
    );

    const updatedTest = testCheck.rows[0];
    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [testId]
    );
    updatedTest.questions = questions.rows;

    res.json(updatedTest);
  } catch (error) {
    console.error('Error adding question:', error);
    res.status(500).json({ error: 'Server error while adding question' });
  }
});

// Update a question
router.put('/:testId/questions/:questionIndex', auth, isTeacher, async (req, res) => {
  const { testId, questionIndex } = req.params;
  const questionData = req.body;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [testId]
    );

    if (questionIndex >= questions.rows.length) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const questionId = questions.rows[questionIndex].question_id;
    await pool.query(
      'UPDATE questions SET possible_answers = $1, correct_answer = $2 WHERE question_id = $3',
      [questionData.possible_answers, questionData.correct_answer, questionId]
    );

    const updatedTest = testCheck.rows[0];
    const updatedQuestions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [testId]
    );
    updatedTest.questions = updatedQuestions.rows;

    res.json(updatedTest);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Server error while updating question' });
  }
});

// Delete a question
router.delete('/:testId/questions/:questionIndex', auth, isTeacher, async (req, res) => {
  const { testId, questionIndex } = req.params;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    const questions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [testId]
    );

    if (questionIndex >= questions.rows.length) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const questionId = questions.rows[questionIndex].question_id;
    await pool.query('DELETE FROM questions WHERE question_id = $1', [questionId]);

    const updatedTest = testCheck.rows[0];
    const updatedQuestions = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY question_order',
      [testId]
    );
    updatedTest.questions = updatedQuestions.rows;

    res.json(updatedTest);
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Server error while deleting question' });
  }
});

/*
 * Test Viewing Routes (Teachers and Students)
 */

// Get all tests for a teacher
router.get('/teacher', auth, isTeacher, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
        COUNT(DISTINCT st.student_test_id) as attempt_count,
        AVG(st.score) as average_score,
        COUNT(DISTINCT q.question_id) as question_count
      FROM tests t
      LEFT JOIN student_tests st ON t.test_id = st.test_id
      LEFT JOIN questions q ON t.test_id = q.test_id
      WHERE t.teacher_id = $1
      GROUP BY t.test_id, t.theme, t.level, t.teacher_id, t.created_at
      ORDER BY t.created_at DESC`,
      [req.user.teacher_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teacher tests:', error);
    res.status(500).json({ error: 'Server error while fetching tests' });
  }
});

// Get available tests for a student
router.get('/student', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }

  try {
    const result = await pool.query(
      `SELECT t.test_id, t.theme, t.level, t.created_at,
        u.full_name as teacher_name,
        st.score as user_score,
        st.attempt_date as completion_date
      FROM tests t
      JOIN users u ON t.teacher_id = u.id
      LEFT JOIN student_tests st ON t.test_id = st.test_id AND st.student_id = $1
      WHERE t.level = (SELECT level FROM students WHERE student_id = $1)
      ORDER BY t.created_at DESC`,
      [req.user.student_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student tests:', error);
    res.status(500).json({ error: 'Server error while fetching tests' });
  }
});

// Get a specific test with questions
router.get('/:id', auth, async (req, res) => {
  try {
    const testResult = await pool.query(
      `SELECT t.*, u.full_name as teacher_name
      FROM tests t
      JOIN users u ON t.teacher_id = u.id
      WHERE t.test_id = $1`,
      [req.params.id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];

    if (req.user.role === 'teacher' && test.teacher_id !== req.user.teacher_id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own tests.' });
    }
    if (req.user.role === 'student') {
      const studentLevel = await pool.query(
        'SELECT level FROM students WHERE student_id = $1',
        [req.user.student_id]
      );
      if (test.level !== studentLevel.rows[0].level) {
        return res.status(403).json({ error: 'Access denied. This test is not for your level.' });
      }
    }

    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1',
      [req.params.id]
    );

    test.questions = questionsResult.rows;

    if (req.user.role === 'student') {
      const attemptResult = await pool.query(
        'SELECT * FROM student_tests WHERE test_id = $1 AND student_id = $2',
        [req.params.id, req.user.student_id]
      );
      test.userAttempt = attemptResult.rows[0] || null;
    }

    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Server error while fetching test' });
  }
});

/*
 * Test Taking Routes (Students Only)
 */

// Get test for taking
router.get('/:id/take', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }

  try {
    const assignmentCheck = await pool.query(
      `SELECT ta.assignment_id, ta.due_date
       FROM test_assignments ta
       WHERE ta.test_id = $1 
       AND ta.student_id = $2 
       AND ta.status = 'assigned'`,
      [req.params.id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or already completed' });
    }

    const assignment = assignmentCheck.rows[0];

    if (new Date(assignment.due_date) < new Date()) {
      await pool.query(
        'UPDATE test_assignments SET status = $1 WHERE assignment_id = $2',
        ['overdue', assignment.assignment_id]
      );
      return res.status(403).json({ error: 'Test is overdue' });
    }

    const testResult = await pool.query(
      `SELECT t.test_id, t.theme, t.level,
              json_agg(json_build_object(
                'question_id', q.question_id,
                'question_type', q.question_type,
                'possible_answers', q.possible_answers::json,
                'correct_answer', q.correct_answer
              ) ORDER BY q.question_id) as questions
       FROM tests t
       JOIN questions q ON t.test_id = q.test_id
       WHERE t.test_id = $1
       GROUP BY t.test_id`,
      [req.params.id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    test.assignment_id = assignment.assignment_id;

    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ error: 'Server error while fetching test' });
  }
});

// Submit test
router.post('/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied. Students only.' });
  }

  const { assignment_id, answers, time_taken } = req.body;

  try {
    await pool.query('BEGIN');

    const assignmentCheck = await pool.query(
      `SELECT ta.assignment_id, ta.status
       FROM test_assignments ta
       WHERE ta.assignment_id = $1 
       AND ta.student_id = $2 
       AND ta.test_id = $3`,
      [assignment_id, req.user.id, req.params.id]
    );

    if (assignmentCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Assignment not found' });
    }

    if (assignmentCheck.rows[0].status !== 'assigned') {
      await pool.query('ROLLBACK');
      return res.status(403).json({ error: 'Test already submitted or overdue' });
    }

    const questions = await pool.query(
      'SELECT question_id, correct_option FROM questions WHERE test_id = $1',
      [req.params.id]
    );

    let correctCount = 0;
    const totalQuestions = questions.rows.length;

    questions.rows.forEach(question => {
      if (answers[question.question_id] === question.correct_option) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);

    const attemptResult = await pool.query(
      `INSERT INTO student_tests 
       (student_id, test_id, assignment_id, score, answers, time_taken, attempt_date)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [req.user.id, req.params.id, assignment_id, score, answers, time_taken]
    );

    await pool.query(
      'UPDATE test_assignments SET status = $1 WHERE assignment_id = $2',
      ['completed', assignment_id]
    );

    await pool.query('COMMIT');

    res.json({
      score,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      attempt_date: attemptResult.rows[0].attempt_date
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Server error while submitting test' });
  }
});

// Get test results
router.get('/:id/results', auth, async (req, res) => {
  try {
    const testResult = await pool.query(
      'SELECT teacher_id FROM tests WHERE test_id = $1',
      [req.params.id]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (req.user.role === 'teacher' && testResult.rows[0].teacher_id !== req.user.teacher_id) {
      return res.status(403).json({ error: 'Access denied. You can only view results for your own tests.' });
    }

    let query;
    const params = [req.params.id];

    if (req.user.role === 'teacher') {
      query = `
        SELECT st.*, u.full_name as student_name
        FROM student_tests st
        JOIN users u ON st.student_id = u.id
        WHERE st.test_id = $1
        ORDER BY st.attempt_date DESC
      `;
    } else {
      query = `
        SELECT st.*
        FROM student_tests st
        WHERE st.test_id = $1 AND st.student_id = $2
      `;
      params.push(req.user.student_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Server error while fetching results' });
  }
});

/*
 * Test Assignment Routes (Teacher Only)
 */

// Assign test to students
router.post('/:testId/assign', auth, isTeacher, async (req, res) => {
  const testId = req.params.testId;
  const { studentIds, dueDate, timeLimit } = req.body;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    await pool.query('BEGIN');

    // Create assignments for each student
    for (const studentId of studentIds) {
      await pool.query(
        `INSERT INTO test_assignments 
         (test_id, student_id, teacher_id, due_date, time_limit, status) 
         VALUES ($1, $2, $3, $4, $5, 'assigned')
         ON CONFLICT (test_id, student_id) 
         DO UPDATE SET due_date = $4, time_limit = $5, status = 'assigned'`,
        [testId, studentId, req.user.teacher_id, dueDate, timeLimit]
      );
    }

    await pool.query('COMMIT');

    // Get updated assignments
    const assignments = await pool.query(
      `SELECT ta.*, u.full_name as student_name
       FROM test_assignments ta
       JOIN users u ON ta.student_id = u.id
       WHERE ta.test_id = $1 AND ta.teacher_id = $2
       ORDER BY ta.assigned_at DESC`,
      [testId, req.user.teacher_id]
    );

    res.json(assignments.rows);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error assigning test:', error);
    res.status(500).json({ error: 'Server error while assigning test' });
  }
});

// Get test assignments
router.get('/:testId/assignments', auth, isTeacher, async (req, res) => {
  const testId = req.params.testId;

  try {
    const testCheck = await pool.query(
      'SELECT * FROM tests WHERE test_id = $1 AND teacher_id = $2',
      [testId, req.user.teacher_id]
    );

    if (testCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found or unauthorized' });
    }

    const assignments = await pool.query(
      `SELECT ta.*, u.full_name as student_name,
              COALESCE(st.score, 0) as score,
              st.attempt_date
       FROM test_assignments ta
       JOIN users u ON ta.student_id = u.id
       LEFT JOIN student_tests st ON ta.test_id = st.test_id AND ta.student_id = st.student_id
       WHERE ta.test_id = $1 AND ta.teacher_id = $2
       ORDER BY ta.assigned_at DESC`,
      [testId, req.user.teacher_id]
    );

    res.json(assignments.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Server error while fetching assignments' });
  }
});

// Update test assignment
router.put('/:testId/assignments/:studentId', auth, isTeacher, async (req, res) => {
  const { testId, studentId } = req.params;
  const { dueDate, timeLimit } = req.body;

  try {
    const result = await pool.query(
      `UPDATE test_assignments 
       SET due_date = $1, time_limit = $2
       WHERE test_id = $3 AND student_id = $4 AND teacher_id = $5
       RETURNING *`,
      [dueDate, timeLimit, testId, studentId, req.user.teacher_id]
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

// Delete test assignment
router.delete('/:testId/assignments/:studentId', auth, isTeacher, async (req, res) => {
  const { testId, studentId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM test_assignments WHERE test_id = $1 AND student_id = $2 AND teacher_id = $3 RETURNING *',
      [testId, studentId, req.user.teacher_id]
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

module.exports = router; 