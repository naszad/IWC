const Router      = require('express').Router;
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const validate    = require('../middleware/validate.middleware');
const controller  = require('../controllers/user.controller');
const { createUserSchema, updateUserSchema } = require('../validation/user.validation');

const router = Router();
/**
 * Routes module for admin operations.
 * All endpoints in this module require authentication and an 'admin' role.
 */
// Apply authentication middleware and ensure the 'admin' role for all admin routes
router.use(requireAuth);
router.use(requireRole('admin'));

// Routes for managing users at /admin/users
/**
 * Routes for managing users.
 *  - GET /admin/users    list all users
 *  - POST /admin/users   create a new user
 */
router
  .route('/users')
  .get(controller.list)
  .post(validate(createUserSchema), controller.create);

// Routes for managing individual users at /admin/users/:id
/**
 * Routes for managing a single user.
 *  - GET /admin/users/:id    retrieve a user by ID
 *  - PUT /admin/users/:id    update a user by ID
 *  - DELETE /admin/users/:id delete a user by ID
 */
router
  .route('/users/:id')
  .get(controller.get)
  .put(validate(updateUserSchema), controller.update)
  .delete(controller.delete);

module.exports = router;
