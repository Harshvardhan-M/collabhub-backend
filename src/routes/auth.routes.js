const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../middlewares/validators');
const { authLimiter } = require('../middlewares/rateLimiter');

const limiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : authLimiter;

router.post('/register', limiter, registerValidation, registerUser);
router.post('/login', limiter, loginValidation, loginUser);

module.exports = router;
