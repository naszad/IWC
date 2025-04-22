// services
const authSvc = require('../services/auth.service');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await authSvc.register({ username, email, password, role });
    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const token = await authSvc.login({ identifier, password });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};
