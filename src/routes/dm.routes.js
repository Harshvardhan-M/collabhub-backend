const express = require('express');
const router = express.Router();
const {
  getConversations,
  sendDirectMessage,
  getConversationHistory,
} = require('../controllers/dm.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /dm/conversations:
 *   get:
 *     summary: List all DM conversations for the logged-in user
 *     tags: [Direct Messages]
 *     responses:
 *       200:
 *         description: List of conversations, most recently active first
 */
router.get('/conversations', protect, getConversations);

/**
 * @openapi
 * /dm/{userId}:
 *   get:
 *     summary: Get direct message history with another user
 *     tags: [Direct Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 30, maximum: 100 }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *         description: Message ID to paginate backwards (older) from
 *     responses:
 *       200:
 *         description: Paginated messages — { messages, hasMore, nextCursor }
 *   post:
 *     summary: Send a direct message to another user
 *     tags: [Direct Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: Hey, got a minute? }
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Invalid content or sending to yourself
 */
router.get('/:userId', protect, getConversationHistory);
router.post('/:userId', protect, sendDirectMessage);

module.exports = router;
