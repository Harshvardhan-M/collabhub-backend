const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/:workspaceId', protect, getMessages);

module.exports = router;
