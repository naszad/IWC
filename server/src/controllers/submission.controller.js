// controllers/submission.controller.js
/**
 * Controller module for submission-related operations.
 * Defines handlers for submitting answers, listing submissions, viewing results, and grading.
 */
const submissionSvc = require('../services/submission.service');
const assessmentSvc = require('../services/assessment.service');

/**
 * Submits answers for a specific assessment by an authenticated student.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - ID of the assessment to submit answers for.
 * @param {Object} req.user - Authenticated user object.
 * @param {string} req.user.id - ID of the student making the submission.
 * @param {Object} req.body - Request payload containing answers.
 * @param {Object} req.body.answers - Map of question IDs to answers provided by the student.
 * @param {Object} res - Express response object.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.submit = async (req, res, next) => {
  try {
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check if assessment exists and is open
    const assessment = await assessmentSvc.getById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check if assessment is currently open
    const now = new Date();
    if (new Date(assessment.open_at) > now || new Date(assessment.close_at) < now) {
      return res.status(403).json({ message: 'Assessment is not currently available for submission' });
    }
    
    const submission = await submissionSvc.submit({
      assessmentId: req.params.id,
      studentId: req.user.id,
      answers: req.body.answers,
    });
    res.json(submission);
  } catch (err) {
    next(err);
  }
};

/**
 * Lists all submissions for a specific assessment.
 * Only accessible to instructors.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - ID of the assessment to list submissions for.
 * @param {Object} res - Express response object.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.listSubmissions = async (req, res, next) => {
  try {
    const submissions = await submissionSvc.listByAssessment(req.params.id);
    res.json(submissions);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves the results of a student's submission for a specific assessment.
 * Only accessible to the student who made the submission.
 *
 * @param {string} assessmentId - ID of the assessment.
 * @param {string} studentId - ID of the student.
 * @returns {Function} Express middleware function.
 */
exports.getResults = (assessmentId, studentId) => async (req, res, next) => {
  try {
    const results = await submissionSvc.getStudentResults(assessmentId, studentId);
    if (!results) {
      return res.status(404).json({ message: 'No submission found for this assessment' });
    }
    res.json(results);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the score and feedback for a specific submission.
 * Only accessible to instructors.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.submissionId - ID of the submission to grade.
 * @param {Object} req.body - Request payload containing grade information.
 * @param {number} req.body.score - The score to assign to the submission.
 * @param {string} [req.body.feedback] - Optional feedback for the student.
 * @param {Object} res - Express response object.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.gradeSubmission = async (req, res, next) => {
  try {
    const submission = await submissionSvc.grade({
      submissionId: req.params.submissionId,
      score: req.body.score,
      feedback: req.body.feedback
    });
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (err) {
    next(err);
  }
};
