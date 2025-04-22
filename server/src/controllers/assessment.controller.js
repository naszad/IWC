const assessmentSvc = require('../services/assessment.service');

exports.create = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const assessment = await assessmentSvc.create({ instructorId, dto: req.body });
    res.status(201).json(assessment);
  } catch (err) {
    next(err);
  }
};

exports.listForStudent = async (req, res, next) => {
  try {
    const assessments = await assessmentSvc.listForStudent(req.user.id);
    res.json(assessments);
  } catch (err) {
    next(err);
  }
};

exports.listForInstructor = async (req, res, next) => {
  try {
    const assessments = await assessmentSvc.listForInstructor(req.user.id);
    res.json(assessments);
  } catch (err) {
    next(err);
  }
};
