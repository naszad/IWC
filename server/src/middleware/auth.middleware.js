const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // lightweight cache: attach only id & role
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
