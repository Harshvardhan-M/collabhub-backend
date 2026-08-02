const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: Get logged-in user's notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 50 }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *         description: Notification ID to paginate backwards (older) from
 *     responses:
 *       200:
 *         description: Paginated notifications — { notifications, hasMore, nextCursor }
 */
router.get('/', protect, getNotifications);

/**
 * @openapi
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', protect, markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification updated
 *       404:
 *         description: Not found
 */
router.put('/:id/read', protect, markAsRead);

module.exports = router;
