const express = require('express');
const router = express.Router();
const { getMessages, searchMessages } = require('../controllers/message.controller');
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
 */
router.get('/:workspaceId', protect, getMessages);

/**
 * @openapi
 * /messages/{workspaceId}/search:
 *   get:
 *     summary: Full-text search messages within a workspace
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: channel
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *     responses:
 *       200:
 *         description: Matching messages, ranked by relevance
 *       400:
 *         description: Missing query
 */
router.get('/:workspaceId/search', protect, searchMessages);

module.exports = router;
