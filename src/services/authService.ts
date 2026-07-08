import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const ADMIN_EMAIL = 'admin@tveco.co.za';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'tveco2026';

interface AuthLoginApiResponse {
  email: string;
  role: 'admin';
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshExpiresInSeconds: number;
}

export interface AuthUser {
  email: string;
  role: 'admin';
  accessToken: string | null;
  expiresAt: string | null;
  refreshToken: string | null;
  refreshExpiresAt: string | null;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    if (!USE_API) {
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return {
          email: ADMIN_EMAIL,
          role: 'admin',
          accessToken: null,
          expiresAt: null,
          refreshToken: null,
          refreshExpiresAt: null,
        };
      }
      throw new Error('Invalid email or password');
    }

    const res = await api.post<AuthLoginApiResponse>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    return {
      email: res.data.email,
      role: res.data.role,
      accessToken: res.data.accessToken,
      expiresAt: new Date(Date.now() + res.data.expiresInSeconds * 1000).toISOString(),
      refreshToken: res.data.refreshToken,
      refreshExpiresAt: new Date(Date.now() + res.data.refreshExpiresInSeconds * 1000).toISOString(),
    };
  },
};
