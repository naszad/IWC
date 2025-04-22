const Router      = require('express').Router;
const auth        = require('../middleware/auth.middleware');
const role        = require('../middleware/role.middleware');
const validate    = require('../middleware/validate.middleware');
const controller  = require('../controllers/instructor.controller');
const { assessmentSchema } = require('../schemas/assessment.schemas');

const router = Router();
router.use(auth, role('instructor', 'admin'));

// CRUD assessments
router
  .route('/assessments')
  .get(controller.listAssessments)                // GET /instructor/assessments
  .post(validate(assessmentSchema), controller.createAssessment);

router
  .route('/assessments/:id')
  .get(controller.getAssessment)                 // read
  .put(validate(assessmentSchema), controller.updateAssessment)
  .delete(controller.deleteAssessment);

// list submissions for an assessment
router.get('/assessments/:id/submissions', controller.listSubmissions);

// grade / update a single submission
router.put('/submissions/:submissionId', controller.gradeSubmission);

module.exports = router;
