// services/submission.service.js
const { Submission, SubmissionAnswer, Question, sequelize } = require('../models');

const autoGrade = (question, answer) => {
  if (question.type === 'multiple_choice' || question.type === 'true_false') {
    return JSON.stringify(question.correct_answer) === JSON.stringify(answer);
  }
  return null; // to be graded manually
};

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
    const answerRows = questions.map((q) => {
      const ans = answers[q.id];
      const correct = autoGrade(q, ans);
      if (correct === true) score += 1;
      return {
        submission_id: submission.id,
        question_id: q.id,
        answer: ans,
        is_correct: correct,
      };
    });
    await SubmissionAnswer.bulkCreate(answerRows, { transaction: tx });
    submission.score = score;
    await submission.save({ transaction: tx });
    return submission;
  });
};
