/* eslint-disable no-unused-vars */
/**
 * Global error-handling middleware for Express.
 * Catches errors passed with next(err) and sends standardized JSON responses.
 *
 * @param {Error} err - Error object, may contain a status property.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {Function} _next - Next middleware (unused).
 */
module.exports = (err, req, res, _next) => {
    console.error(err); // or use a logger
    const status = err.status ?? 500;
    res.status(status).json({ message: err.message ?? 'Server error' });
  };
  