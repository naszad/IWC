const Router      = require('express').Router;
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate    = require('../middleware/validate.middleware');
const assessmentController  = require('../controllers/assessment.controller');
const submissionController  = require('../controllers/submission.controller');
const { Assessment } = require('../models/index');
const { createAssessmentSchema, updateAssessmentSchema } = require('../validation/assessment.validation');
const { gradeSubmissionSchema } = require('../validation/submission.validation');

/**
 * Routes module for instructor operations.
 * Applies authentication and ensures 'instructor' role.
 */
const router = Router();
// Apply authentication and role middleware
router.use(requireAuth);
router.use(requireRole('instructor'));

/**
 * Assessment management routes:
 *  - GET /instructor/assessments           list all assessments created by the instructor
 *  - POST /instructor/assessments          create a new assessment
 */
router
  .route('/assessments')
  .get((req, res, next) => assessmentController.listForUser(req.user.id)(req, res, next))
  .post(validate(createAssessmentSchema), assessmentController.create);

/**
 * Assessment detail routes:
 *  - GET /instructor/assessments/:id       retrieve a specific assessment
 *  - PUT /instructor/assessments/:id       update an existing assessment
 *  - DELETE /instructor/assessments/:id    delete an existing assessment
 */
router
  .route('/assessments/:id')
  .get((req, res, next) => assessmentController.getById(req.params.id)(req, res, next))
  .put(validate(updateAssessmentSchema), (req, res, next) => 
    assessmentController.update(req.params.id, req.body)(req, res, next))
  .delete(assessmentController.delete);

// list submissions for an assessment
router.get('/assessments/:id/submissions', submissionController.listSubmissions);

// grade / update a single submission
router.put('/submissions/:submissionId', 
  validate(gradeSubmissionSchema),
  submissionController.gradeSubmission
);

module.exports = router;
