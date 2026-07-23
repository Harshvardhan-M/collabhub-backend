/**
 * Custom error class for expected/operational errors (bad input, not found, etc.)
 * Lets the global error handler distinguish these from unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
