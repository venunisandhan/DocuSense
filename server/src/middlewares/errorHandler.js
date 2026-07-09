
const logger = require('../utils/logger');

const env = require('../config/env');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const isOperational = err.isOperational || false;

  logger.error(err.message, {
    statusCode,
    code,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const message = isOperational
    ? err.message
    : 'Something went wrong. Please try again later.';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;