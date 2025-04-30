// services/auth.service.js
/**
 * Service module for authentication operations.
 * Provides functions to register new users and authenticate existing ones.
 */
const { User, Sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const config = require('../config');

/**
 * Registers a new user by hashing the password and creating a user record.
 *
 * @param {Object} params - Registration parameters.
 * @param {string} params.username - Desired username for the new user.
 * @param {string} params.email - Email address of the new user.
 * @param {string} params.password - Plain text password to be hashed.
 * @param {string} params.role - Role assigned to the new user (e.g., 'instructor', 'student').
 * @returns {Promise<Object>} Created user instance.
 */
exports.register = async ({ username, email, password, role }) => {
  const hash = await bcrypt.hash(password, config.bcrypt.saltRounds);
  return User.create({ username, email, password_hash: hash, role });
};

/**
 * Authenticates a user by identifier and password, returning a JWT if credentials are valid.
 *
 * @param {Object} params - Login parameters.
 * @param {string} params.identifier - Username or email for authentication.
 * @param {string} params.password - Plain text password for verification.
 * @returns {Promise<string>} Signed JWT token containing user ID and role.
 * @throws {Error} If the credentials are invalid.
 */
exports.login = async ({ identifier, password }) => {
  // identifier = email OR username
  const user = await User.findOne({
    where: { [Sequelize.Op.or]: [{ email: identifier }, { username: identifier }] }
  });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  return jwt.sign({ id: user.id, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};
