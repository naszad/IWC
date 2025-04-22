/* eslint-disable no-unused-vars */
module.exports = (err, req, res, _next) => {
    console.error(err); // or use a logger
    const status = err.status ?? 500;
    res.status(status).json({ message: err.message ?? 'Server error' });
  };
  