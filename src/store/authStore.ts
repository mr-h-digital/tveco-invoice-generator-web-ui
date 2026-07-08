import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../services/authSession';

interface AuthStore {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
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

  logout: () => {
    clearAuthSession();
    useAuthStore.setState({ user: null });
  },
}));
