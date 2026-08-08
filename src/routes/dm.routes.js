const express = require('express');
const router = express.Router();
const {
  getConversations,
  sendDirectMessage,
  getConversationHistory,
  markConversationRead,
  getUnreadCount,
} = require('../controllers/dm.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /dm/conversations:
 *   get:
 *     summary: List all DM conversations for the logged-in user (includes unreadCount per conversation)
 *     tags: [Direct Messages]
 *     responses:
 *       200:
 *         description: List of conversations, most recently active first
 */
router.get('/conversations', protect, getConversations);

/**
 * @openapi
 * /dm/unread-count:
 *   get:
 *     summary: Get the total number of unread direct messages
 *     tags: [Direct Messages]
 *     responses:
 *       200:
 *         description: '{ unreadCount }'
 */
router.get('/unread-count', protect, getUnreadCount);

/**
 * @openapi
 * /dm/{userId}:
 *   get:
 *     summary: Get direct message history with another user (marks their messages as read)
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

/**
 * @openapi
 * /dm/{userId}/read:
 *   put:
 *     summary: Explicitly mark all messages from a user as read
 *     tags: [Direct Messages]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.put('/:userId/read', protect, markConversationRead);

module.exports = router;
