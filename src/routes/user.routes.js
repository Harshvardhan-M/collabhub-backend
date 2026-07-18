const express = require('express');
const router = express.Router();
const { getMe, updateMe } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
