const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const { before } = req.query;

    const query = { recipient: req.user._id };
    if (before) {
      const cursorNotif = await Notification.findById(before);
      if (cursorNotif) {
        query.createdAt = { $lt: cursorNotif.createdAt };
      }
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    const hasMore = notifications.length === limit;

    res.status(200).json({
      notifications,
      hasMore,
      nextCursor: hasMore ? notifications[notifications.length - 1]._id : null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
