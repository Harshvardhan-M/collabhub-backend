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
 *               description: { type: string, example: A test workspace }
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Workspace' }
 *   get:
 *     summary: List workspaces the logged-in user belongs to
 *     tags: [Workspaces]
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Workspace' }
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
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Workspace' }
 *       403:
 *         description: Not a member of this workspace
 *       404:
 *         description: Workspace not found
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
 *               inviteCode: { type: string, example: a1b2c3d4 }
 *     responses:
 *       200:
 *         description: Joined workspace
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Workspace' }
 *       404:
 *         description: Invalid invite code
 */
router.post('/join', protect, joinWorkspace);

// Nested: /api/workspaces/:workspaceId/channels
router.use('/:workspaceId/channels', channelRoutes);

module.exports = router;
