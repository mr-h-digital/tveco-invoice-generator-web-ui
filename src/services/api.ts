import axios, { AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { clearAuthSession, loadAuthSession } from './authSession';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = loadAuthSession()?.accessToken;
  if (token) {
    if (config.headers?.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = new AxiosHeaders({
        ...config.headers,
        Authorization: `Bearer ${token}`,
      });
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'An unexpected error occurred';

    if (error.response?.status === 401) {
      clearAuthSession();
      if (!window.location.hash.startsWith('#/track/')) {
        window.location.hash = '/login';
      }
    }

    console.error('API Error:', message);
    if (error.response?.status === 409) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
