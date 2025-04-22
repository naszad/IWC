// services/auth.service.js
const { User, Sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt     = require('jsonwebtoken');

exports.register = async ({ username, email, password, role }) => {
  const hash = await bcrypt.hash(password, 10);
  return User.create({ username, email, password_hash: hash, role });
};

exports.login = async ({ identifier, password }) => {
  // identifier = email OR username
  const user = await User.findOne({
    where: { [Sequelize.Op.or]: [{ email: identifier }, { username: identifier }] }
  });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error('Invalid credentials');
  }
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '4h' });
};
