const Channel = require('../models/Channel');
const Workspace = require('../models/Workspace');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const checkMembership = (workspace, userId) =>
  workspace.members.some((m) => m.user.toString() === userId.toString());

exports.createChannel = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;
  const { name, description, isPrivate } = req.body;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  if (!checkMembership(workspace, req.user._id)) {
    return next(new AppError('Not a member of this workspace', 403));
  }

  const channel = await Channel.create({
    name,
    description,
    isPrivate,
    workspace: workspaceId,
    createdBy: req.user._id,
  });

  res.status(201).json(channel);
});

exports.getChannels = asyncHandler(async (req, res, next) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  if (!checkMembership(workspace, req.user._id)) {
    return next(new AppError('Not a member of this workspace', 403));
  }

  const channels = await Channel.find({ workspace: workspaceId }).sort({ createdAt: 1 });
  res.status(200).json(channels);
});

exports.deleteChannel = asyncHandler(async (req, res, next) => {
  const { workspaceId, channelId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return next(new AppError('Workspace not found', 404));

  const membership = workspace.members.find((m) => m.user.toString() === req.user._id.toString());
  if (!membership) return next(new AppError('Not a member of this workspace', 403));

  const channel = await Channel.findOne({ _id: channelId, workspace: workspaceId });
  if (!channel) return next(new AppError('Channel not found', 404));

  const isCreator = channel.createdBy.toString() === req.user._id.toString();
  const isAdmin = membership.role === 'admin';
  if (!isCreator && !isAdmin) {
    return next(new AppError('Not authorized to delete this channel', 403));
  }

  if (channel.name === 'general') {
    return next(new AppError('The default "general" channel cannot be deleted', 400));
  }

  await channel.deleteOne();
  res.status(200).json({ message: 'Channel deleted' });
});
