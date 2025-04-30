const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('No token provided');
      error.status = 401;
      throw error;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      const error = new Error('User not found');
      error.status = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      err.status = 401;
      err.message = 'Invalid token';
    }
    next(err);
  }
};

/**
 * Role-based authorization middleware
 * @param {string} role - Required role for access
 * @returns {Function} Middleware function
 */
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('User not authenticated');
      error.status = 401;
      return next(error);
    }

    if (req.user.role !== role) {
      const error = new Error('Unauthorized');
      error.status = 403;
      return next(error);
    }

    next();
  };
};
