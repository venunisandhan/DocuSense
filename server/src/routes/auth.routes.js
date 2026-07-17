
const express = require('express');

const authController = require('../controllers/auth.controller');

const authenticate = require('../middlewares/authenticate');

const validate = require('../middlewares/validate');

const asyncHandler = require('../utils/asyncHandler');

const {
  registerSchema,
  loginSchema,
  completeGoogleSchema,
} = require('../validators/auth.schema');

const router = express.Router();

const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts, please try again later.' } },
});


router.post('/register',
           authLimiter,
           validate(registerSchema),
           asyncHandler(authController.register));

router.post('/login',
           authLimiter,
           validate(loginSchema),
           asyncHandler(authController.login));

router.post('/refresh',
           asyncHandler(authController.refresh));

router.post('/logout',
           authenticate,
           asyncHandler(authController.logout));

router.get('/me',
          authenticate,
          asyncHandler(authController.me));

router.get('/google',
          authController.googleRedirect);

router.get('/google/callback',
          asyncHandler(authController.googleCallback));

router.post('/google/complete',
        validate(completeGoogleSchema),
        asyncHandler(authController.googleComplete));



module.exports = router;
