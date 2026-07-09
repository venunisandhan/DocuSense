
const ApiError = require('../utils/ApiError');

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required', 'NO_TOKEN'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action', 'FORBIDDEN'));
  }

  next();
};

module.exports = authorize;