const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Runs after the rule chains below; collects errors into one clean response
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(new AppError(message, 400));
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const workspaceValidation = [
  body('name').trim().notEmpty().withMessage('Workspace name is required'),
  validate,
];

module.exports = { registerValidation, loginValidation, workspaceValidation };
