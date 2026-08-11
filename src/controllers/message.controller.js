const Message = require('../models/Message');
const Workspace = require('../models/Workspace');

exports.getMessages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const channel = req.query.channel || 'general';
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const { before } = req.query; // message _id to paginate backwards from

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this workspace' });

    const query = { workspace: workspaceId, channel };
    if (before) {
      const cursorMessage = await Message.findById(before);
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    // Fetch newest-first for pagination, then reverse to chronological order for display
    const messages = await Message.find(query)
      .populate('sender', 'name avatar')
      .populate('reactions.users', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    const hasMore = messages.length === limit;

    res.status(200).json({
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[0]._id : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  GET /api/messages/:workspaceId/search?q=&channel=
// @desc   Full-text search of messages within a workspace (optionally scoped to a channel)
exports.searchMessages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { q, channel } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    const isMember = workspace.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not a member of this workspace' });

    const query = {
      workspace: workspaceId,
      deleted: { $ne: true },
      $text: { $search: q.trim() },
    };
    if (channel) query.channel = channel;

    const results = await Message.find(query, { score: { $meta: 'textScore' } })
      .populate('sender', 'name avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit);

    res.status(200).json({ query: q, results });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
