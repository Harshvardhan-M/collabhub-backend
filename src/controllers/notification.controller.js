const Notification = require('../models/Notification');

// @route  GET /api/notifications
// @desc   Get logged-in user's notifications (most recent first)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .populate('workspace', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  PUT /api/notifications/:id/read
// @desc   Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  PUT /api/notifications/read-all
// @desc   Mark all of the user's notifications as read
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
