import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const businessAPI = {
  getMe: () => api.get('/businesses/me'),
  update: (data) => api.put('/businesses/me', data),
  list: () => api.get('/businesses'),
  get: (id) => api.get(`/businesses/${id}`),
};

export const moduleAPI = {
  list: (params) => api.get('/modules', { params }),
  get: (id) => api.get(`/modules/${id}`),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  delete: (id) => api.delete(`/modules/${id}`),
  seedDefaults: () => api.post('/modules/seed-defaults'),
};

export const entryAPI = {
  list: (params) => api.get('/entries', { params }),
};

export const auditLogAPI = {
  list: (params) => api.get('/audit-logs', { params }),
};

export const planAPI = {
  list: () => api.get('/plans'),
  listSubscriptions: () => api.get('/subscriptions'),
  updateSubscription: (businessId, data) => api.put(`/subscriptions/${businessId}`, data),
};

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
  growth: (params) => api.get('/analytics/growth', { params }),
  insights: () => api.get('/analytics/insights'),
  charts: (moduleId, params) => api.get(`/analytics/charts/${moduleId}`, { params }),
};

export const rewardAPI = {
  leaderboard: (params) => api.get('/rewards/leaderboard', { params }),
};

export const reportAPI = {
  generate: (data) => api.post('/reports/generate', data),
  list: (params) => api.get('/reports', { params }),
};

export default api;
