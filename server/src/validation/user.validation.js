const { z } = require('zod');

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  password_hash: z.string().min(6, 'Password hash is required'),
  role: z.enum(['admin', 'instructor', 'student'], 'Role must be one of admin, instructor, student'),
});

const updateUserSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'instructor', 'student'], 'Role must be one of admin, instructor, student').optional(),
  password_hash: z.string().min(6, 'Password hash must be at least 6 characters').optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
}; 