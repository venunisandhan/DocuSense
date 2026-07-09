
const authService = require('../services/auth.service');

const env = require('../config/env');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

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

module.exports = { register, login, refresh, logout, me };