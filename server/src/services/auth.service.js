const jwt = require('jsonwebtoken');

const User = require('../models/User');

const ApiError = require('../utils/ApiError');

const env = require('../config/env');

const crypto = require('crypto');

const googleClient = require('../config/googleClient');

const emailService = require('./email.service');

function generatePendingRoleToken(googleProfile) {
  return jwt.sign(
    { purpose: 'GOOGLE_ROLE_SELECTION', googleId: googleProfile.sub, email: googleProfile.email, name: googleProfile.name },
    env.PENDING_ROLE_TOKEN_SECRET,
    { expiresIn: '10m' }
  );
}

async function handleGoogleCallback(code) {
  const { tokens } = await googleClient.getToken(code);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    user = await User.findOne({ email: payload.email });
    if (user && user.authProvider === 'LOCAL') {
      throw new ApiError(409, 'An account with this email already exists. Please log in with your password.', 'EMAIL_TAKEN');
    }
  }

  if (user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    return { status: 'LOGGED_IN', user, accessToken, refreshToken };
  }

  const pendingToken = generatePendingRoleToken(payload);
  return { status: 'NEEDS_ROLE', pendingToken };
}

async function completeGoogleSignup(pendingToken, role) {
  let payload;
  try {
    payload = jwt.verify(pendingToken, env.PENDING_ROLE_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, 'This sign-up link has expired. Please try signing in with Google again.', 'INVALID_PENDING_TOKEN');
  }

  if (payload.purpose !== 'GOOGLE_ROLE_SELECTION') {
    throw new ApiError(400, 'Invalid token', 'INVALID_PENDING_TOKEN');
  }

  const existing = await User.findOne({ $or: [{ googleId: payload.googleId }, { email: payload.email }] });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
  }

  const user = await User.create({
    name: payload.name,
    email: payload.email,
    googleId: payload.googleId,
    authProvider: 'GOOGLE',
    role,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
}

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

async function register({ name, email, password, role }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists', 'EMAIL_TAKEN');
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    authProvider: 'LOCAL',
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || user.authProvider !== 'LOCAL') {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated', 'ACCOUNT_INACTIVE');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return { user, accessToken, refreshToken };
}

async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User no longer valid', 'INVALID_REFRESH_TOKEN');
  }

  return generateAccessToken(user);
}

const RESET_TOKEN_EXPIRY_MINUTES = 15;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

async function forgotPassword(email) {
  const user = await User.findOne({ email, authProvider: 'LOCAL' });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${rawToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  // No return value -- deliberately identical behavior whether or not a
  // matching account was found, so the controller can send the same generic
  // response either way and avoid leaking account existence.
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+resetPasswordTokenHash +resetPasswordExpiresAt');

  if (!user) {
    throw new ApiError(400, 'This reset link is invalid or has expired', 'INVALID_RESET_TOKEN');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();
}

module.exports = {
  register,
  login,
  refreshAccessToken,
  generateAccessToken,
  generateRefreshToken,
  handleGoogleCallback,
  completeGoogleSignup,
  forgotPassword,
  resetPassword,
};
