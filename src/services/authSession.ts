import type { AuthUser } from './authService';

export const AUTH_STORAGE_KEY = 'tveco_auth';

const DEFAULT_EXPIRY_SKEW_MS = 30_000;

export interface AuthTokenRefreshPayload {
  email: string;
  role: 'admin' | 'client';
  clientId: string | null;
  accessToken: string;
  expiresInSeconds: number;
}

function isExpired(isoTime: string | null, skewMs = 0): boolean {
  if (!isoTime) return false;
  const millis = Date.parse(isoTime);
  if (Number.isNaN(millis)) return true;
  return millis <= Date.now() + skewMs;
}

export function loadAuthSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as AuthUser;
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

export function isAccessTokenExpired(user: AuthUser, skewMs = DEFAULT_EXPIRY_SKEW_MS): boolean {
  if (!user.accessToken || !user.expiresAt) return false;
  return isExpired(user.expiresAt, skewMs);
}

export function applyRefreshedTokens(user: AuthUser, payload: AuthTokenRefreshPayload): AuthUser {
  return {
    ...user,
    email: payload.email,
    role: payload.role,
    clientId: payload.clientId,
    accessToken: payload.accessToken,
    expiresAt: new Date(Date.now() + payload.expiresInSeconds * 1000).toISOString(),
  };
}
