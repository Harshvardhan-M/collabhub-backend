const express = require('express');
const router = express.Router();
const {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  joinWorkspace,
  updateMemberRole,
  removeMember,
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

/**
 * @openapi
 * /workspaces/{id}/members/{userId}/role:
 *   put:
 *     summary: Promote or demote a workspace member (admin only)
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, member] }
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Only admins can change roles
 */
router.put('/:id/members/:userId/role', protect, updateMemberRole);

/**
 * @openapi
 * /workspaces/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a workspace (admin, or a member removing themselves)
 *     tags: [Workspaces]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Not authorized to remove this member
 */
router.delete('/:id/members/:userId', protect, removeMember);

// Nested: /api/workspaces/:workspaceId/channels
router.use('/:workspaceId/channels', channelRoutes);

module.exports = router;
