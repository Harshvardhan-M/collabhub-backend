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

  res.status(200).json(conversations);
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

  const conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!conversation) {
    return res.status(200).json([]);
  }

  const messages = await DirectMessage.find({ conversation: conversation._id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 })
    .limit(100);

  res.status(200).json(messages);
});
