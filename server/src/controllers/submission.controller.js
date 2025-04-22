// controllers/submission.controller.js
const submissionSvc = require('../services/submission.service');

exports.submit = async (req, res, next) => {
  try {
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
