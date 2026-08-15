const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createChannel,
  getChannels,
  deleteChannel,
  markChannelRead,
} = require('../controllers/channel.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /workspaces/{workspaceId}/channels:
 *   post:
 *     summary: Create a channel in a workspace
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Channel created
 *   get:
 *     summary: List channels in a workspace (each with an unreadCount for the current user)
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of channels
 */
router.post('/', protect, createChannel);
router.get('/', protect, getChannels);

/**
 * @openapi
 * /workspaces/{workspaceId}/channels/{channelId}:
 *   delete:
 *     summary: Delete a channel (creator or workspace admin only)
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Channel deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/:channelId', protect, deleteChannel);

/**
 * @openapi
 * /workspaces/{workspaceId}/channels/{channelName}/read:
 *   put:
 *     summary: Mark a channel as read (up to now) for the current user
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: channelName
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Channel marked as read
 */
router.put('/:channelName/read', protect, markChannelRead);

module.exports = router;
