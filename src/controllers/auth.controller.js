const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateAccessToken, issueTokenPair, issueRefreshToken } = require('../utils/tokens');
const { sendEmail } = require('../utils/email');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = await issueTokenPair(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    user.status = 'online';
    await user.save();

    const { accessToken, refreshToken } = await issueTokenPair(user._id);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    await stored.deleteOne();

    const accessToken = generateAccessToken(stored.user);
    const newRefreshToken = await issueRefreshToken(stored.user);

    res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  POST /api/auth/forgot-password
// @desc   Request a password reset — always returns a generic success message
//         (doesn't reveal whether the email exists, to prevent account enumeration)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    const user = await User.findOne({ email });
    if (!user) {
      // Same response as the success case — don't leak whether the account exists
      return res.status(200).json(genericResponse);
    }

    // Invalidate any previous outstanding reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    const rawToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      user: user._id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your CollabHub password',
      text: `You requested a password reset. This link expires in 30 minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    });

    res.status(200).json(genericResponse);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @route  POST /api/auth/reset-password
// @desc   Reset a password using a valid, unexpired reset token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const tokenHash = hashToken(token);
    const resetRecord = await PasswordResetToken.findOne({ tokenHash });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetRecord.user);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword; // pre('save') hook re-hashes it
    await user.save();

    // Token is single-use
    await resetRecord.deleteOne();

    // Revoke all existing sessions — a leaked/forgotten password is a good reason
    // to force re-login everywhere
    await RefreshToken.deleteMany({ user: user._id });

    res.status(200).json({ message: 'Password reset successfully. Please log in again.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
