const Router     = require('express').Router;
const validate   = require('../middleware/validate.middleware');
const controller = require('../controllers/auth.controller');
const { loginSchema, registerSchema } = require('../schemas/auth.schemas');

const router = Router();

router.post('/login',    validate(loginSchema),    controller.login);
router.post('/register', validate(registerSchema), controller.register);

module.exports = router;
