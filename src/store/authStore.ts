import { create } from 'zustand';
import { authService, type AuthUser } from '../services/authService';
import { clearAuthSession, loadAuthSession, saveAuthSession } from '../services/authSession';

interface AuthActionResult {
  ok: boolean;
  message?: string;
}

interface AuthStore {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  signup: (payload: {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(() => ({
  user: loadAuthSession(),

  login: async (email, password) => {
    try {
      const user = await authService.login(email, password);
      saveAuthSession(user);
      useAuthStore.setState({ user });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: extractErrorMessage(error, 'Invalid email or password.'),
      };
    }
  },

  signup: async (payload) => {
    try {
      const user = await authService.signup(payload);
      saveAuthSession(user);
      useAuthStore.setState({ user });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: extractErrorMessage(error, 'Could not create client profile. Please check your details.'),
      };
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

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
