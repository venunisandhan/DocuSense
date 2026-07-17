import axios from 'axios';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('unauthorized'));
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/refresh')) {
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }

    return Promise.reject(error);
  }
);

export default api;
