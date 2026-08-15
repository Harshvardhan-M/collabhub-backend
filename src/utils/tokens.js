const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

const issueRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await RefreshToken.create({ user: userId, token, expiresAt });

  return token;
};

const issueTokenPair = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await issueRefreshToken(userId);
  return { accessToken, refreshToken };
};

module.exports = { generateAccessToken, issueRefreshToken, issueTokenPair };
