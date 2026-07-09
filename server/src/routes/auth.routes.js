const express = require('express');

const authController = require('../controllers/auth.controller');

const authenticate = require('../middlewares/authenticate');

const validate = require('../middlewares/validate');

const asyncHandler = require('../utils/asyncHandler');

const { registerSchema, loginSchema } = require('../validators/auth.schema');

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

module.exports = router;