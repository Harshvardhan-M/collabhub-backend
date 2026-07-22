const Notification = require('../models/Notification');

/**
 * Create a notification and, if a Socket.IO instance is provided,
 * emit it in real time to the recipient's personal room (their user ID).
 */
const createNotification = async ({ recipient, sender, type, workspace, message, io }) => {
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    workspace,
    message,
  });

  const populated = await notification.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'workspace', select: 'name' },
  ]);

  if (io) {
    io.to(`user:${recipient}`).emit('newNotification', populated);
  }

  return populated;
};

module.exports = { createNotification };
