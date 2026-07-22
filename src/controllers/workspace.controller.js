const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const { createNotification } = require('../utils/notify');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex');

// @route  POST /api/workspaces
// @desc   Create a new workspace
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      inviteCode: generateInviteCode(),
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  GET /api/workspaces
// @desc   Get all workspaces the logged-in user belongs to
exports.getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar status');

    res.status(200).json(workspaces);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  GET /api/workspaces/:id
// @desc   Get a single workspace by ID
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar status');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  POST /api/workspaces/join
// @desc   Join a workspace using an invite code
exports.joinWorkspace = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'Already a member of this workspace' });
    }

    workspace.members.push({ user: req.user._id, role: 'member' });
    await workspace.save();

    await createNotification({
      recipient: workspace.owner,
      sender: req.user._id,
      type: 'workspace_join',
      workspace: workspace._id,
      message: `${req.user.name} joined "${workspace.name}"`,
      io: req.app.get('io'),
    });

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
