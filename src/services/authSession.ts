import type { AuthUser } from './authService';

export const AUTH_STORAGE_KEY = 'tveco_auth';

export function loadAuthSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const user = JSON.parse(raw) as AuthUser;
    if (user.expiresAt && Date.parse(user.expiresAt) <= Date.now()) {
      clearAuthSession();
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function saveAuthSession(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
