// services
const authSvc = require('../services/auth.service');

/**
 * Controller module for authentication operations.
 * Defines handlers for user registration and login.
 */

/**
 * Registers a new user with the provided credentials and role.
 *
 * @param {Object} req - Express request object containing user credentials.
 * @param {string} req.body.username - Desired username for the new user.
 * @param {string} req.body.email - Email address of the new user.
 * @param {string} req.body.password - Plain text password for the new user.
 * @param {string} req.body.role - Role assigned to the user (e.g., instructor or student).
 * @param {Object} res - Express response object used to send the created user's information.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const user = await authSvc.register({ username, email, password, role });
    res.status(201).json({ id: user.id, username: user.username, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticates a user with identifier and password, returning a JWT token.
 *
 * @param {Object} req - Express request object containing login credentials.
 * @param {string} req.body.identifier - Username or email for login.
 * @param {string} req.body.password - Plain text password for authentication.
 * @param {Object} res - Express response object used to send back the JWT token.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const token = await authSvc.login({ identifier, password });
    res.json({ token });
  } catch (err) {
    next(err);
  }
};