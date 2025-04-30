const Router     = require('express').Router;
const validate   = require('../middleware/validate.middleware');
const controller = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../validation/auth.validation');

/**
 * Routes module for authentication operations.
 * Defines endpoints for user login and registration.
 */
const router = Router();

// POST /login - authenticate a user and return a JWT token
router.post('/login',    validate(loginSchema),    controller.login);

// POST /register - register a new user and return created user information
router.post('/register', validate(registerSchema), controller.register);

module.exports = router;
