
const jwt = require('jsonwebtoken');

const User = require('../models/User');

const ApiError = require('../utils/ApiError');

const env = require('../config/env');

const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required', 'NO_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User no longer valid', 'INVALID_TOKEN');
  }

  req.user = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
  next();
});

module.exports = authenticate;