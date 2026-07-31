const express = require('express');
const router = express.Router();
const { getMe, updateMe } = require('../controllers/user.controller');
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

module.exports = router;
