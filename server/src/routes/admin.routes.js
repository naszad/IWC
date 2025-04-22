const Router      = require('express').Router;
const auth        = require('../middleware/auth.middleware');
const role        = require('../middleware/role.middleware');
const validate    = require('../middleware/validate.middleware');
const controller  = require('../controllers/admin.controller');
const { userSchema } = require('../schemas/user.schemas');

const router = Router();
router.use(auth, role('admin'));

// /admin/users
router
  .route('/users')
  .get(controller.listUsers)
  .post(validate(userSchema), controller.createUser);

// /admin/users/:id
router
  .route('/users/:id')
  .get(controller.getUser)
  .put(validate(userSchema), controller.updateUser)
  .delete(controller.deleteUser);

module.exports = router;
