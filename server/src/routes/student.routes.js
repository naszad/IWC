const Router     = require('express').Router;
const auth       = require('../middleware/auth.middleware');
const controller = require('../controllers/student.controller');

const router = Router();
router.use(auth);                     // all endpoints below require a JWT

// GET /api/assessments     → list open assessments for this student
router.get('/assessments', controller.listAssessments);

// GET /api/assessments/:id → questions + metadata
router.get('/assessments/:id', controller.getAssessment);

// POST /api/assessments/:id/submissions → submit answers
router.post('/assessments/:id/submissions', controller.submitAssessment);

// GET /api/assessments/:id/results → scores + feedback
router.get('/assessments/:id/results', controller.getResults);

module.exports = router;
