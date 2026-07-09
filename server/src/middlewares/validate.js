
const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const firstError = result.error.errors[0];
    return next(new ApiError(400, firstError.message, 'VALIDATION_ERROR'));
  }

  req.body = result.data.body ?? req.body;
  next();
};

module.exports = validate;