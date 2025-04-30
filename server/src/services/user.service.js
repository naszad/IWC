// services/user.service.js
/**
 * Service module for user-related operations.
 * Provides functions to list, retrieve, update, delete, and create users, excluding sensitive fields.
 */
const { User } = require('../models');

/**
 * Lists all users in the system, omitting password hashes.
 *
 * @returns {Promise<Array<Object>>} Array of user instances.
 */
exports.list  = ()           => User.findAll({ attributes: { exclude: ['password_hash'] } });
/**
 * Retrieves a single user by ID, excluding the password hash.
 *
 * @param {string} id - ID of the user to retrieve.
 * @returns {Promise<Object|null>} The user instance, or null if not found.
 */
exports.get   = (id)         => User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
/**
 * Updates a user by ID with the specified data.
 *
 * @param {string} id - ID of the user to update.
 * @param {Object} data - Fields to update on the user.
 * @returns {Promise<[number, Array<Object>]>} A tuple with the number of affected rows and the updated records.
 */
exports.update = (id, data)  => User.update(data, { where: { id }, returning: true });
/**
 * Deletes a user by ID.
 *
 * @param {string} id - ID of the user to delete.
 * @returns {Promise<number>} The number of rows deleted (0 or 1).
 */
exports.delete = (id)        => User.destroy({ where: { id } });
/**
 * Creates a new user record.
 *
 * @param {Object} data - Data for the new user.
 * @returns {Promise<Object>} The created user instance.
 */
exports.create = (data)      => User.create(data);
