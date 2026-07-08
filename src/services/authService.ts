import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const ADMIN_EMAIL = 'admin@tveco.co.za';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'tveco2026';

export interface AuthUser {
  email: string;
  role: 'admin';
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    if (!USE_API) {
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        return { email: ADMIN_EMAIL, role: 'admin' };
      }
      throw new Error('Invalid email or password');
    }

    const res = await api.post<AuthUser>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    return {
      email: res.data.email,
      role: 'admin',
    };
  },
};
