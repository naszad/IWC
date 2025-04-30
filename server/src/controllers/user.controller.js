/**
 * Controller module for user-related operations.
 * Defines handlers for listing, retrieving, updating, deleting, and creating users.
 */
const userSvc = require('../services/user.service');

/**
 * Lists all users in the system.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object used to return list of users.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.list = async (req, res, next) => {
  try {
    const users = await userSvc.list();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a user by ID.
 *
 * @param {Object} req - Express request object.
 * @param {string} req.params.id - ID of the user to retrieve.
 * @param {Object} res - Express response object used to return the user.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.get = async (req, res, next) => {
  try {
    const user = await userSvc.get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates a user by ID.
 *
 * @param {Object} req - Express request object.
 * @param {string} req.params.id - ID of the user to update.
 * @param {Object} req.body - Data to update for the user.
 * @param {Object} res - Express response object used to return the updated user.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.update = async (req, res, next) => {
  try {
    const [_, [updated]] = await userSvc.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Deletes a user by ID.
 *
 * @param {Object} req - Express request object.
 * @param {string} req.params.id - ID of the user to delete.
 * @param {Object} res - Express response object used to send deletion response.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.delete = async (req, res, next) => {
  try {
    const deleted = await userSvc.delete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * Creates a new user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Payload containing new user data.
 * @param {Object} res - Express response object used to return the created user.
 * @param {Function} next - Error handling middleware function.
 * @returns {void}
 */
exports.create = async (req, res, next) => {
  try {
    const user = await userSvc.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};