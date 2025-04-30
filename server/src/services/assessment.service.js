// services/assessment.service.js
/**
 * Service module for assessment-related operations.
 * Provides functions to create assessments and list assessments based on user role.
 */
const { Assessment, Question, sequelize, Sequelize } = require('../models');

/**
 * Creates a new assessment and optionally associated questions in a transaction.
 *
 * @param {Object} params - The parameters for assessment creation.
 * @param {string} params.instructorId - ID of the instructor creating the assessment.
 * @param {Object} params.dto - Data transfer object containing assessment properties and optional questions.
 * @param {Array<Object>} [params.dto.questions] - Optional list of question objects.
 * @returns {Promise<Object>} The created assessment instance.
 */
exports.create = async ({ instructorId, dto }) => {
  return sequelize.transaction(async (tx) => {
    const assessment = await Assessment.create(
      { ...dto, instructor_id: instructorId },
      { transaction: tx }
    );
    // bulk‑insert questions if provided
    if (dto.questions?.length) {
      const questions = dto.questions.map((q, i) => ({
        assessment_id: assessment.id,
        prompt: q.prompt || q.text, // Map either prompt or text to prompt
        type: q.type,
        points: q.points,
        options: q.options || [],
        correct_answer: q.correct_answer || '',
        position: i + 1,
      }));
      await Question.bulkCreate(questions, { transaction: tx });
    }
    return assessment;
  });
};

const userSvc = require('./user.service');

/**
 * Lists assessments visible to a specific user based on their role.
 *
 * - Students receive currently open assessments.
 * - Instructors receive assessments they created.
 * - Other roles receive an empty array.
 *
 * @param {string} userId - ID of the user to list assessments for.
 * @returns {Promise<Array<Object>>} Array of assessment instances.
 * @throws {Error} If the user is not found.
 */
exports.list = async (userId) => {
  const user = await userSvc.get(userId);
  if (!user) throw new Error('User not found');

  if (user.role === 'student') {
    return Assessment.findAll({
      where: {
        open_at: { [Sequelize.Op.lte]: new Date() },
        close_at: { [Sequelize.Op.gte]: new Date() }
      },
      include: [{ model: Question, as: 'questions', attributes: [] }],
    });
  }

  if (user.role === 'instructor') {
    return Assessment.findAll({
      where: { instructor_id: userId }
    });
  }

  // no assessments for other roles
  return [];
};

/**
 * Retrieves a specific assessment by ID.
 *
 * @param {string} id - ID of the assessment to retrieve.
 * @returns {Promise<Object>} The retrieved assessment instance.
 */
exports.getById = async (id) => {
  return Assessment.findByPk(id);
};

/**
 * Updates an existing assessment by ID.
 *
 * @param {string} id - ID of the assessment to update.
 * @param {Object} dto - Data transfer object containing assessment properties.
 * @returns {Promise<Object>} The updated assessment instance.
 */
exports.update = async (id, dto) => {
  return Assessment.update(dto, { where: { id } });
};

/**
 * Deletes an existing assessment by ID.
 *
 * @param {string} id - ID of the assessment to delete.
 * @returns {Promise<number>} The number of rows affected.
 */
exports.delete = async (id) => {
  return Assessment.destroy({ where: { id } });
};
