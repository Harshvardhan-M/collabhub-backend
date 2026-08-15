const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const Channel = require('../models/Channel');
const { createNotification } = require('../utils/notify');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const generateInviteCode = () => crypto.randomBytes(4).toString('hex');

exports.createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Workspace name is required' });

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
      inviteCode: generateInviteCode(),
    });

    await Channel.create({
      name: 'general',
      workspace: workspace._id,
      createdBy: req.user._id,
    });

    res.status(201).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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

exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email avatar status');

    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isMember = workspace.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not a member of this workspace' });

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.joinWorkspace = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    const workspace = await Workspace.findOne({ inviteCode });
    if (!workspace) return res.status(404).json({ message: 'Invalid invite code' });

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

exports.updateMemberRole = asyncHandler(async (req, res, next) => {
  const { id, userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    return next(new AppError('Role must be "admin" or "member"', 400));
  }

  const workspace = await Workspace.findById(id);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  const requester = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!requester || requester.role !== 'admin') {
    return next(new AppError('Only admins can change member roles', 403));
  }

  if (userId === workspace.owner.toString()) {
    return next(new AppError("Cannot change the workspace owner's role", 400));
  }

  const targetMember = workspace.members.find((m) => m.user.toString() === userId);
  if (!targetMember) return next(new AppError('User is not a member of this workspace', 404));

  targetMember.role = role;
  await workspace.save();

  res.status(200).json({ message: `Member role updated to ${role}`, member: targetMember });
});

exports.removeMember = asyncHandler(async (req, res, next) => {
  const { id, userId } = req.params;

  const workspace = await Workspace.findById(id);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  if (userId === workspace.owner.toString()) {
    return next(
      new AppError('The workspace owner cannot be removed. Delete the workspace instead.', 400)
    );
  }

  const requester = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!requester) return next(new AppError('Not a member of this workspace', 403));

  const isSelf = userId === req.user._id.toString();
  const isAdmin = requester.role === 'admin';
  if (!isSelf && !isAdmin) {
    return next(new AppError('Only admins can remove other members', 403));
  }

  const memberExists = workspace.members.some((m) => m.user.toString() === userId);
  if (!memberExists) return next(new AppError('User is not a member of this workspace', 404));

  workspace.members = workspace.members.filter((m) => m.user.toString() !== userId);
  await workspace.save();

  res.status(200).json({ message: 'Member removed from workspace' });
});
