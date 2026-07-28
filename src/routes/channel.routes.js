const express = require('express');
const router = express.Router({ mergeParams: true }); // access :workspaceId from parent router
const { createChannel, getChannels, deleteChannel } = require('../controllers/channel.controller');
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: dev-team }
 *               description: { type: string }
 *               isPrivate: { type: boolean }
 *     responses:
 *       201:
 *         description: Channel created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Channel' }
 *   get:
 *     summary: List channels in a workspace
 *     tags: [Channels]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Channel' }
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
 *         description: Not authorized to delete this channel
 *       404:
 *         description: Channel not found
 */
router.delete('/:channelId', protect, deleteChannel);

module.exports = router;
