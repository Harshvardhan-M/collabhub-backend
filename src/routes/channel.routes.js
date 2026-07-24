const express = require('express');
const router = express.Router({ mergeParams: true }); // access :workspaceId from parent router
const { createChannel, getChannels, deleteChannel } = require('../controllers/channel.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, createChannel);
router.get('/', protect, getChannels);
router.delete('/:channelId', protect, deleteChannel);

module.exports = router;
