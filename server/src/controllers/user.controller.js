const userSvc = require('../services/user.service');

exports.list = async (req, res, next) => {
  try {
    const users = await userSvc.list();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const user = await userSvc.get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const [_, [updated]] = await userSvc.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await userSvc.remove(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
