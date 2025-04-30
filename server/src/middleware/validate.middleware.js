/**
 * Middleware factory to validate request body against a Zod schema.
 * Validates req.body and, on failure, returns a 400 response with error messages.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema used to validate req.body.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
module.exports = (schema) => (req, res, next) => {
    // Attempt to parse the request body against the schema
    const result = schema.safeParse(req.body); // Zod only
  
    // If validation succeeds, proceed to next handler
    if (result.success) return next();
  
    // Collect validation error messages
    const errors = result.error.issues.map((i) => i.message);
  
    // Respond with 400 and validation errors
    res.status(400).json({ message: 'Validation error', errors });
  };
  