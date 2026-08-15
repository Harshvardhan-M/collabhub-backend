const User = require('../models/User');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getMe = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      status: updatedUser.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);

    if (!q || !q.trim()) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ name: regex }, { email: regex }],
    })
      .select('name email avatar status')
      .limit(limit);

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
