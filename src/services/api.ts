import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
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
    console.error('API Error:', message);
    if (error.response?.status === 409) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
