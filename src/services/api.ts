import axios, { AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import {
  applyRefreshedTokens,
  clearAuthSession,
  isAccessTokenExpired,
  loadAuthSession,
  saveAuthSession,
  type AuthTokenRefreshPayload,
} from './authSession';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshInFlight: Promise<string | null> | null = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshApi
      .post<{ data: AuthTokenRefreshPayload } | AuthTokenRefreshPayload>('/auth/refresh')
      .then((response) => {
        const payload = 'data' in response.data ? response.data.data : response.data;
        const currentSession = loadAuthSession();
        if (!currentSession) return null;

        const updatedSession = applyRefreshedTokens(currentSession, payload);
        saveAuthSession(updatedSession);
        return updatedSession.accessToken;
      })
      .catch(() => {
        clearAuthSession();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

api.interceptors.request.use(async (config) => {
  const session = loadAuthSession();
  let token = session?.accessToken ?? null;

  if (session && token && isAccessTokenExpired(session)) {
    token = await refreshAccessToken();
  }

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
        window.location.hash = '/client-zone/auth';
      }
    }

    console.error('API Error:', message);
    if (error.response?.status === 409) toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
