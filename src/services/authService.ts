import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const ADMIN_EMAIL = 'admin@tveco.co.za';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'tveco2026';

interface AuthLoginApiResponse {
  email: string;
  role: 'admin' | 'client';
  clientId: string | null;
  accessToken: string;
  expiresInSeconds: number;
}

export interface AuthUser {
  email: string;
  role: 'admin' | 'client';
  clientId: string | null;
  accessToken: string | null;
  expiresAt: string | null;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    if (!USE_API) {
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return {
          email: ADMIN_EMAIL,
          role: 'admin',
          clientId: null,
          accessToken: null,
          expiresAt: null,
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
      clientId: res.data.clientId,
      accessToken: res.data.accessToken,
      expiresAt: new Date(Date.now() + res.data.expiresInSeconds * 1000).toISOString(),
    };
  },

  async signup(payload: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): Promise<AuthUser> {
    if (!USE_API) {
      throw new Error('Sign up requires API mode');
    }

    const res = await api.post<AuthLoginApiResponse>('/auth/signup', {
      companyName: payload.companyName.trim(),
      contactName: payload.contactName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      password: payload.password,
    });

    return {
      email: res.data.email,
      role: res.data.role,
      clientId: res.data.clientId,
      accessToken: res.data.accessToken,
      expiresAt: new Date(Date.now() + res.data.expiresInSeconds * 1000).toISOString(),
    };
  },

  async logout(): Promise<void> {
    if (!USE_API) return;
    await api.post('/auth/logout');
  },
};
