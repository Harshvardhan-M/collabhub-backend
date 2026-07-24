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

router.post('/', protect, workspaceValidation, createWorkspace);
router.get('/', protect, getMyWorkspaces);
router.get('/:id', protect, getWorkspaceById);
router.post('/join', protect, joinWorkspace);

// Nested: /api/workspaces/:workspaceId/channels
router.use('/:workspaceId/channels', channelRoutes);

module.exports = router;
