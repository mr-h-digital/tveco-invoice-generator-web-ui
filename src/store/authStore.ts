import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../services/authSession';

interface AuthStore {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(() => ({
  user: loadAuthSession(),

  login: async (email, password) => {
    try {
      const user = await authService.login(email, password);
      saveAuthSession(user);
      useAuthStore.setState({ user });
      return true;
    } catch {
      return false;
    }
  },

  signup: async (payload) => {
    try {
      const user = await authService.signup(payload);
      saveAuthSession(user);
      useAuthStore.setState({ user });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      clearAuthSession();
      useAuthStore.setState({ user: null });
    }
  },
}));
