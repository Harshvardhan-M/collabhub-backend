const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

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

    // Handle a new chat message: persist it, then broadcast to the room
    socket.on('sendMessage', async ({ workspaceId, channel = 'general', content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await Message.create({
          workspace: workspaceId,
          sender: socket.user._id,
          content: content.trim(),
          channel,
        });

        const populatedMessage = await message.populate('sender', 'name avatar');

        const room = `${workspaceId}:${channel}`;
        io.to(room).emit('newMessage', populatedMessage);
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
