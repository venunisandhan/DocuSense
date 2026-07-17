const authService = require('../services/auth.service');

const env = require('../config/env');

const googleClient = require('../config/googleClient');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function googleRedirect(req, res) {
  const url = googleClient.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
  });
  res.redirect(url);
}

async function googleCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${env.CLIENT_ORIGIN}/login?error=google_auth_failed`);
  }

  const result = await authService.handleGoogleCallback(code);

  if (result.status === 'NEEDS_ROLE') {
    return res.redirect(`${env.CLIENT_ORIGIN}/oauth/choose-role?token=${result.pendingToken}`);
  }

  res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
  res.redirect(`${env.CLIENT_ORIGIN}/oauth/success`);
}

async function googleComplete(req, res) {
  const { token, role } = req.body;
  const { user, accessToken, refreshToken } = await authService.completeGoogleSignup(token, role);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}

async function register(req, res) {
  const { name, email, password, role } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({ name, email, password, role });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(201).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.status(200).json({
    success: true,
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    },
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.cookies;
  const accessToken = await authService.refreshAccessToken(refreshToken);

  res.status(200).json({ success: true, data: { accessToken } });
}

async function logout(req, res) {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
}

async function me(req, res) {
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
}


module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  googleRedirect,
  googleCallback,
  googleComplete,
};