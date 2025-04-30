const { z } = require('zod');

const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'instructor', 'student'], 'Role must be one of admin, instructor, student'),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
}; 