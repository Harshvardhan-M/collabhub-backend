const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /messages/{workspaceId}:
 *   get:
 *     summary: Get chat message history for a workspace channel
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: channel
 *         schema: { type: string, default: general }
 *     responses:
 *       200:
 *         description: List of messages (most recent 100)
 *       403:
 *         description: Not a member of this workspace
 */
router.get('/:workspaceId', protect, getMessages);

module.exports = router;
