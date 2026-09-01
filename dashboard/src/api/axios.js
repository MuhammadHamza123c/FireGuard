import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('profile');
        localStorage.removeItem('expires_at');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(e => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
        const { access_token, refresh_token: newRefresh, expires_in } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refresh_token', newRefresh);
        localStorage.setItem('expires_at', String(Date.now() + expires_in * 1000));
        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('profile');
        localStorage.removeItem('expires_at');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
