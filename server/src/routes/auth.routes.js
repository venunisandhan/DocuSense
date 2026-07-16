
const express = require('express');

const authController = require('../controllers/auth.controller');

const authenticate = require('../middlewares/authenticate');

const validate = require('../middlewares/validate');

const asyncHandler = require('../utils/asyncHandler');

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  completeGoogleSchema,
} = require('../validators/auth.schema');

const router = express.Router();


router.post('/register',
           validate(registerSchema),
           asyncHandler(authController.register));

router.post('/login',
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

router.post(
        '/forgot-password',
        validate(forgotPasswordSchema),
        asyncHandler(authController.forgotPassword));

router.post(
        '/reset-password',
        validate(resetPasswordSchema),
        asyncHandler(authController.resetPassword));

module.exports = router;
