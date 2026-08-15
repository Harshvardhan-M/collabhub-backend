const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const findOrCreateConversation = async (userA, userB) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants: [userA, userB] });
  }

  return conversation;
};

exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar status')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  const withUnreadCounts = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await DirectMessage.countDocuments({
        conversation: conversation._id,
        sender: { $ne: req.user._id },
        read: false,
      });
      return { ...conversation.toObject(), unreadCount };
    })
  );

  res.status(200).json(withUnreadCounts);
});

exports.sendDirectMessage = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(new AppError('Message content is required', 400));
  }

  if (userId === req.user._id.toString()) {
    return next(new AppError('Cannot send a message to yourself', 400));
  }

  const conversation = await findOrCreateConversation(req.user._id, userId);

  const message = await DirectMessage.create({
    conversation: conversation._id,
    sender: req.user._id,
    content: content.trim(),
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const populatedMessage = await message.populate('sender', 'name avatar');

  res.status(201).json(populatedMessage);
});

exports.getConversationHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const { before } = req.query;

  const conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!conversation) {
    return res.status(200).json({ messages: [], hasMore: false, nextCursor: null });
  }

  const query = { conversation: conversation._id };
  if (before) {
    const cursorMessage = await DirectMessage.findById(before);
    if (cursorMessage) {
      query.createdAt = { $lt: cursorMessage.createdAt };
    }
  }

  const messages = await DirectMessage.find(query)
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(limit);

  const hasMore = messages.length === limit;

  await DirectMessage.updateMany(
    { conversation: conversation._id, sender: userId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    messages: messages.reverse(),
    hasMore,
    nextCursor: hasMore ? messages[0]._id : null,
  });
});

exports.markConversationRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!conversation) {
    return res.status(200).json({ message: 'No conversation to mark as read' });
  }

  await DirectMessage.updateMany(
    { conversation: conversation._id, sender: userId, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({ message: 'Conversation marked as read' });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id }).select('_id');
  const conversationIds = conversations.map((c) => c._id);

  const unreadCount = await DirectMessage.countDocuments({
    conversation: { $in: conversationIds },
    sender: { $ne: req.user._id },
    read: false,
  });

  res.status(200).json({ unreadCount });
});
