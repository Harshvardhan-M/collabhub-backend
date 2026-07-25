const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const { resolveMentions } = require('../utils/mentions');
const { createNotification } = require('../utils/notify');

const initChatSocket = (io) => {
  // Authenticate socket connections using the JWT sent from the client
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token provided'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Personal room for direct notifications to this user
    socket.join(`user:${socket.user._id}`);

    // Join a workspace's channel room
    socket.on('joinChannel', ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.join(room);
      socket.emit('joinedChannel', { room });
    });

    // Leave a channel room
    socket.on('leaveChannel', ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.leave(room);
    });

    // Handle a new chat message: validate channel, persist it, broadcast, notify mentions
    socket.on('sendMessage', async ({ workspaceId, channel = 'general', content }) => {
      try {
        if (!content || !content.trim()) return;

        const channelExists = await Channel.findOne({ workspace: workspaceId, name: channel });
        if (!channelExists) {
          return socket.emit('errorMessage', { message: `Channel "${channel}" does not exist` });
        }

        const message = await Message.create({
          workspace: workspaceId,
          sender: socket.user._id,
          content: content.trim(),
          channel,
        });

        const populatedMessage = await message.populate('sender', 'name avatar');

        const room = `${workspaceId}:${channel}`;
        io.to(room).emit('newMessage', populatedMessage);

        // Notify any @mentioned workspace members in real time
        const mentionedUsers = await resolveMentions(content, workspaceId, socket.user._id);
        for (const mentionedUser of mentionedUsers) {
          await createNotification({
            recipient: mentionedUser._id,
            sender: socket.user._id,
            type: 'mention',
            workspace: workspaceId,
            message: `${socket.user.name} mentioned you in #${channel}`,
            io,
          });
        }
      } catch (err) {
        socket.emit('errorMessage', { message: 'Failed to send message', error: err.message });
      }
    });

    // Typing indicator
    socket.on('typing', ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.to(room).emit('userTyping', { userId: socket.user._id, name: socket.user.name });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);
    });
  });
};

module.exports = initChatSocket;
