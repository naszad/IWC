const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment.controller');
const submissionController = require('../controllers/submission.controller');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { submitAnswersSchema } = require('../validation/submission.validation');

/**
 * Routes module for student operations.
 * Applies authentication middleware to protect all student endpoints.
 */

// Apply authentication middleware to all routes
router.use(requireAuth);
router.use(requireRole('student'));

// GET /api/student/assessments → list available assessments
/**
 * List available assessments for the authenticated student
 * GET /assessments - List available assessments for the authenticated student
 */
router.get('/assessments', (req, res, next) => {
  assessmentController.listForUser(req.user.id)(req, res, next);
});

// GET /api/assessments/:id → questions + metadata
/**
 * Get assessment details including questions
 * GET /assessments/:id - Get assessment details and questions
 */
router.get('/assessments/:id', (req, res, next) => {
  assessmentController.getAssessmentDetails(req.params.id)(req, res, next);
});

// POST /api/assessments/:id/submit → submit answers
/**
 * Submit answers for an assessment
 * POST /assessments/:id/submit - Submit answers for an assessment
 */
router.post('/assessments/:id/submit',
  // First validate that the UUID is valid before other validation
  (req, res, next) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    next();
  },
  validate(submitAnswersSchema),
  submissionController.submit
);

// GET /api/assessments/:id/results → get scores and feedback
/**
 * Get scores and feedback for a submitted assessment
 * GET /assessments/:id/results - Get scores and feedback for a submitted assessment
 */
router.get('/assessments/:id/results', (req, res, next) => {
  submissionController.getResults(req.params.id, req.user.id)(req, res, next);
});

module.exports = router;
