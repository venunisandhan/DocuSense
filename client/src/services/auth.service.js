import api, { setAccessToken } from './api';

export const login = async (credentials) => {
  const { data } = await api.post('/auth/login', credentials);
  setAccessToken(data.data.accessToken);
  return data.data;
};

export const register = async (userData) => {
  const { data } = await api.post('/auth/register', userData);
  setAccessToken(data.data.accessToken);
  return data.data;
};

export const logout = async () => {
  const { data } = await api.post('/auth/logout');
  setAccessToken(null);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/me');
  return data.data;
};
