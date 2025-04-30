/**
 * Controller module for assessment-related operations.
 * Defines handlers for creating and listing assessments.
 */
const assessmentSvc = require('../services/assessment.service');

/**
 * Creates a new assessment for the authenticated instructor.
 *
 * @param {Object} req - Express request object containing user data and request body.
 * @param {Object} res - Express response object used to send the created assessment.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.create = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const assessment = await assessmentSvc.create({ instructorId, dto: req.body });
    res.status(201).json(assessment);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves all assessments associated with a specific user.
 *
 * @param {string} userId - ID of the user to fetch assessments for.
 * @returns {Function} Express middleware function.
 */
exports.listForUser = (userId) => async (req, res, next) => {
  try {
    const assessments = await assessmentSvc.list(userId);
    res.json(assessments);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a specific assessment by ID.
 *
 * @param {string} id - ID of the assessment to retrieve.
 * @returns {Function} Express middleware function.
 */
exports.getById = (id) => async (req, res, next) => {
  try {
    const assessment = await assessmentSvc.getById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves assessment details including questions for students.
 *
 * @param {string} id - ID of the assessment to retrieve.
 * @returns {Function} Express middleware function.
 */
exports.getAssessmentDetails = (id) => async (req, res, next) => {
  try {
    const assessment = await assessmentSvc.getById(id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Check if assessment is accessible to student
    const now = new Date();
    if (new Date(assessment.open_at) > now || new Date(assessment.close_at) < now) {
      return res.status(403).json({ message: 'Assessment is not currently available' });
    }
    
    // Include questions for student view
    const questions = await assessment.getQuestions({
      attributes: ['id', 'prompt', 'type', 'points', 'options'],
      order: [['position', 'ASC']]
    });
    
    res.json({
      ...assessment.toJSON(),
      questions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Updates an existing assessment by ID.
 *
 * @param {string} id - ID of the assessment to update.
 * @param {Object} data - Updated assessment data.
 * @returns {Function} Express middleware function.
 */
exports.update = (id, data) => async (req, res, next) => {
  try {
    await assessmentSvc.update(id, data);
    const updated = await assessmentSvc.getById(id);
    if (!updated) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes an existing assessment by ID.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.delete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await assessmentSvc.delete(id);
    if (result === 0) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};