const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../middlewares/validators');

router.post('/register', registerValidation, registerUser);
router.post('/login', loginValidation, loginUser);

module.exports = router;
