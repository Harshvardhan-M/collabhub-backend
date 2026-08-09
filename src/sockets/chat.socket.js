const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const ChannelRead = require('../models/ChannelRead');
const { resolveMentions } = require('../utils/mentions');
const { createNotification } = require('../utils/notify');

// Tracks how many active sockets each user has open (they may have multiple
// tabs/devices connected). Status only flips to offline when the count hits 0.
const activeConnections = new Map();

const getWorkspaceRoomIds = async (userId) => {
  const workspaces = await Workspace.find({ 'members.user': userId }).select('_id');
  return workspaces.map((w) => w._id.toString());
};

const broadcastPresence = (io, workspaceIds, userId, status) => {
  workspaceIds.forEach((id) => {
    io.to(`workspace:${id}`).emit('presenceUpdate', { userId, status });
  });
};

const initChatSocket = (io) => {
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

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    // Personal room for direct notifications to this user
    socket.join(`user:${socket.user._id}`);

    const userId = socket.user._id.toString();
    const workspaceIds = await getWorkspaceRoomIds(socket.user._id);
    workspaceIds.forEach((id) => socket.join(`workspace:${id}`));

    const previousCount = activeConnections.get(userId) || 0;
    activeConnections.set(userId, previousCount + 1);

    if (previousCount === 0) {
      await User.findByIdAndUpdate(userId, { status: 'online' });
      broadcastPresence(io, workspaceIds, userId, 'online');
    }

    socket.on('joinChannel', async ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.join(room);
      socket.emit('joinedChannel', { room });

      try {
        await ChannelRead.findOneAndUpdate(
          { user: socket.user._id, workspace: workspaceId, channel },
          { lastReadAt: new Date() },
          { upsert: true }
        );
      } catch (err) {
        // Non-critical — don't interrupt the join if the read marker fails to save
        console.error('Failed to update channel read marker:', err.message);
      }
    });

    socket.on('leaveChannel', ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.leave(room);
    });

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

    socket.on('typing', ({ workspaceId, channel = 'general' }) => {
      const room = `${workspaceId}:${channel}`;
      socket.to(room).emit('userTyping', { userId: socket.user._id, name: socket.user.name });
    });

    socket.on('editMessage', async ({ messageId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('errorMessage', { message: 'Message not found' });
        }
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('errorMessage', { message: 'Not authorized to edit this message' });
        }
        if (message.deleted) {
          return socket.emit('errorMessage', { message: 'Cannot edit a deleted message' });
        }

        message.content = content.trim();
        message.edited = true;
        await message.save();

        const populatedMessage = await message.populate('sender', 'name avatar');
        const room = `${message.workspace}:${message.channel}`;
        io.to(room).emit('messageEdited', populatedMessage);
      } catch (err) {
        socket.emit('errorMessage', { message: 'Failed to edit message', error: err.message });
      }
    });

    socket.on('deleteMessage', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('errorMessage', { message: 'Message not found' });
        }
        if (message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('errorMessage', { message: 'Not authorized to delete this message' });
        }

        message.deleted = true;
        message.content = '[message deleted]';
        await message.save();

        const room = `${message.workspace}:${message.channel}`;
        io.to(room).emit('messageDeleted', { _id: message._id, channel: message.channel });
      } catch (err) {
        socket.emit('errorMessage', { message: 'Failed to delete message', error: err.message });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.user.name} (${socket.id})`);

      const remaining = (activeConnections.get(userId) || 1) - 1;

      if (remaining <= 0) {
        activeConnections.delete(userId);
        await User.findByIdAndUpdate(userId, { status: 'offline' });
        broadcastPresence(io, workspaceIds, userId, 'offline');
      } else {
        activeConnections.set(userId, remaining);
      }
    });
  });
};

module.exports = initChatSocket;
