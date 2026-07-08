import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';

interface AuthStore {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const STORAGE_KEY = 'tveco_auth';

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>(() => ({
  user: loadUser(),

  login: async (email, password) => {
    try {
      const user = await authService.login(email, password);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      useAuthStore.setState({ user });
      return true;
    } catch {
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAuthStore.setState({ user: null });
  },
}));
