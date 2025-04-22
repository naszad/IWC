// services/assessment.service.js
const { Assessment, Question, sequelize, Sequelize } = require('../models');

exports.create = async ({ instructorId, dto }) => {
  return sequelize.transaction(async (tx) => {
    const assessment = await Assessment.create(
      { ...dto, instructor_id: instructorId },
      { transaction: tx }
    );
    // bulk‑insert questions if provided
    if (dto.questions?.length) {
      const questions = dto.questions.map((q, i) => ({
        ...q,
        assessment_id: assessment.id,
        position: i + 1,
      }));
      await Question.bulkCreate(questions, { transaction: tx });
    }
    return assessment;
  });
};

exports.listForStudent = (studentId, now = new Date()) =>
  Assessment.findAll({
    where: { open_at: { [Sequelize.Op.lte]: now }, close_at: { [Sequelize.Op.gte]: now } },
    include: [{ model: Question, as: 'questions', attributes: [] }],
  });

exports.listForInstructor = (instructorId) =>
  Assessment.findAll({ where: { instructor_id: instructorId } });
