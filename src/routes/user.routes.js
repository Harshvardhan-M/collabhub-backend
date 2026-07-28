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
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 */
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
