import { create } from 'zustand';

interface AuthUser {
  email: string;
  role: 'admin';
}

interface AuthStore {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const STORAGE_KEY = 'tveco_auth';

const ADMIN = {
  email: 'admin@tveco.co.za',
  password: 'tveco2026',
  role: 'admin' as const,
};

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

  login: (email, password) => {
    if (
      email.trim().toLowerCase() === ADMIN.email &&
      password === ADMIN.password
    ) {
      const user: AuthUser = { email: ADMIN.email, role: ADMIN.role };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      useAuthStore.setState({ user });
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    useAuthStore.setState({ user: null });
  },
}));
