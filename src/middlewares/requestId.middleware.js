const crypto = require('crypto');

// Attaches a unique ID to every request so logs for the same request
// (across middleware, controllers, and error handling) can be correlated.
const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

module.exports = requestId;
