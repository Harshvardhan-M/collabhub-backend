const express = require('express');
const router = express.Router();
const { getMe, updateMe, searchUsers } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *   put:
 *     summary: Update the logged-in user's profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Updated user
 */
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

/**
 * @openapi
 * /users/search:
 *   get:
 *     summary: Search users by name or email
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 25 }
 *     responses:
 *       200:
 *         description: Matching users
 *       400:
 *         description: Missing query
 */
router.get('/search', protect, searchUsers);

module.exports = router;
