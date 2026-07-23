const AppError = require('../utils/AppError');

/**
 * Centralized error-handling middleware. Catches:
 * - Our own AppError (operational, expected errors)
 * - Mongoose validation errors
 * - Mongoose duplicate key errors
 * - Mongoose bad ObjectId (CastError)
 * - JWT errors
 * - Anything else (falls back to 500)
 */
const errorHandler = (err, req, res, next) => {
  let error = err;
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 400;
    message = `Duplicate value for field: ${field}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token, please log in again';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// 404 handler for unknown routes
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = { errorHandler, notFound };
