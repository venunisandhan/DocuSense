import api from './api';

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  return data.data; // { user }
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  return data.data; // { user }
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.data; // { user }
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
};
