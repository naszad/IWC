/**
 * Middleware factory to enforce role-based authorization.
 * Allows access only if the authenticated user's role is in the allowed list.
 *
 * @param {...string} allowed - List of roles permitted to access the route.
 * @returns {import('express').RequestHandler} Express middleware to check user role.
 */
module.exports = (...allowed) => (req, res, next) => {
    // Ensure the user is authenticated
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });

    // Check if user role is allowed
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });

    // User is authorized, proceed to next handler
    next();
  };
  