// services/submission.service.js
/**
 * Service module for submission-related operations.
 * Handles creating submissions, auto-grading answers, and storing submission details.
 */
const { Submission, SubmissionAnswer, Question, User, sequelize } = require('../models');

/**
 * Auto-grades a question based on its type and provided answer.
 *
 * @param {Object} question - The question instance to grade.
 * @param {*} answer - The student's submitted answer.
 * @returns {boolean|null} True if correct, false if incorrect, or null if subject to manual grading.
 */
const autoGrade = (question, answer) => {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    return JSON.stringify(question.correct_answer) === JSON.stringify(answer);
  }
  return null; // to be graded manually
};

/**
 * Submits answers for an assessment, auto-grades applicable questions, and records the submission.
 *
 * @param {Object} params - Submission parameters.
 * @param {string} params.assessmentId - ID of the assessment being submitted.
 * @param {string} params.studentId - ID of the student making the submission.
 * @param {Object} params.answers - Mapping of question IDs to answer values.
 * @returns {Promise<Object>} The created submission instance with an updated score.
 */
exports.submit = async ({ assessmentId, studentId, answers }) => {
  return sequelize.transaction(async (tx) => {
    // create submission row
    const submission = await Submission.create(
      { assessment_id: assessmentId, student_id: studentId, score: 0 },
      { transaction: tx }
    );

    // fetch questions once
    const questions = await Question.findAll({
      where: { assessment_id: assessmentId },
      transaction: tx,
    });

    // grade each answer
    let score = 0;
    let totalPoints = 0;
    const answerRows = [];
    
    for (const q of questions) {
      const ans = answers[q.id];
      const correct = autoGrade(q, ans);
      totalPoints += q.points;
      if (correct === true) score += q.points;
      
      answerRows.push({
        submission_id: submission.id,
        question_id: q.id,
        answer: ans || null,
        is_correct: correct
      });
    }
    
    if (answerRows.length > 0) {
      await SubmissionAnswer.bulkCreate(answerRows, { transaction: tx });
    }
    
    // Calculate percentage score
    submission.score = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    await submission.save({ transaction: tx });
    return submission;
  });
};

/**
 * Retrieves all submissions for a specific assessment.
 *
 * @param {string} assessmentId - ID of the assessment to get submissions for.
 * @returns {Promise<Array>} Array of submission instances with student info.
 */
exports.listByAssessment = async (assessmentId) => {
  return Submission.findAll({
    where: { assessment_id: assessmentId },
    include: [
      { 
        model: User, 
        as: 'student',
        attributes: ['id', 'username', 'email'] 
      }
    ],
    order: [['submitted_at', 'DESC']]
  });
};

/**
 * Retrieves a student's submission results for a specific assessment.
 *
 * @param {string} assessmentId - ID of the assessment.
 * @param {string} studentId - ID of the student.
 * @returns {Promise<Object>} The submission results with detailed answers.
 */
exports.getStudentResults = async (assessmentId, studentId) => {
  const submission = await Submission.findOne({
    where: { 
      assessment_id: assessmentId,
      student_id: studentId
    }
  });

  if (!submission) return null;

  const answers = await SubmissionAnswer.findAll({
    where: { submission_id: submission.id },
    include: [
      { 
        model: Question, 
        as: 'question',
        attributes: ['id', 'prompt', 'type', 'points'] 
      }
    ]
  });

  return {
    submission,
    answers
  };
};

/**
 * Updates the score and feedback for a specific submission.
 *
 * @param {Object} params - Grade parameters.
 * @param {string} params.submissionId - ID of the submission to grade.
 * @param {number} params.score - The score to assign to the submission.
 * @param {string} [params.feedback] - Optional feedback for the student.
 * @returns {Promise<Object>} The updated submission instance.
 */
exports.grade = async ({ submissionId, score, feedback }) => {
  const submission = await Submission.findByPk(submissionId);
  if (!submission) return null;

  submission.score = score;
  if (feedback) submission.feedback = feedback;
  await submission.save();

  return submission;
};
