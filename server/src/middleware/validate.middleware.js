module.exports = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body); // Zod only
  
    if (result.success) return next();
  
    const errors = result.error.issues.map((i) => i.message);
  
    res.status(400).json({ message: 'Validation error', errors });
  };
  