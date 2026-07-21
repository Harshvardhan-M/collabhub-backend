const Message = require('../models/Message');
const Workspace = require('../models/Workspace');

// @route  GET /api/messages/:workspaceId?channel=general
// @desc   Get message history for a workspace channel
exports.getMessages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const channel = req.query.channel || 'general';

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const isMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const messages = await Message.find({ workspace: workspaceId, channel })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
