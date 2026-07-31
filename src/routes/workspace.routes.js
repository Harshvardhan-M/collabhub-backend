const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  joinWorkspace,
} = require('../controllers/workspace.controller');
const { protect } = require('../middlewares/auth.middleware');
const { workspaceValidation } = require('../middlewares/validators');
const channelRoutes = require('./channel.routes');

/**
 * @openapi
 * /workspaces:
 *   post:
 *     summary: Create a new workspace (auto-creates a #general channel)
 *     tags: [Workspaces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: My Team }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Workspace created
 *   get:
 *     summary: List workspaces the logged-in user belongs to
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: List of workspaces
 */
router.post('/', protect, workspaceValidation, createWorkspace);
router.get('/', protect, getMyWorkspaces);

/**
 * @openapi
 * /workspaces/{id}:
 *   get:
 *     summary: Get a single workspace by ID
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Workspace details
 *       403:
 *         description: Not a member
 *       404:
 *         description: Not found
 */
router.get('/:id', protect, getWorkspaceById);

/**
 * @openapi
 * /workspaces/join:
 *   post:
 *     summary: Join a workspace using an invite code
 *     tags: [Workspaces]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inviteCode]
 *             properties:
 *               inviteCode: { type: string }
 *     responses:
 *       200:
 *         description: Joined workspace
 *       404:
 *         description: Invalid invite code
 */
router.post('/join', protect, joinWorkspace);

// Nested: /api/workspaces/:workspaceId/channels
router.use('/:workspaceId/channels', channelRoutes);

module.exports = router;
