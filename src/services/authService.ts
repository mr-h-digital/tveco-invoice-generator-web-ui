import api from './api';
import axios from 'axios';

const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;
const ADMIN_EMAIL = 'admin@tveco.co.za';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'tveco2026';

interface AuthLoginApiResponse {
  email: string;
  role: 'admin' | 'client';
  clientId: string | null;
  accessToken: string;
  expiresInSeconds: number;
}

type PartialAuthLoginApiResponse = Partial<AuthLoginApiResponse> & {
  data?: Partial<AuthLoginApiResponse>;
};

export interface AuthUser {
  email: string;
  role: 'admin' | 'client';
  clientId: string | null;
  accessToken: string | null;
  expiresAt: string | null;
}

export interface OtpRecoveryRequestPayload {
  purpose: 'USERNAME_RECOVERY' | 'PASSWORD_RESET';
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  identifier: string;
}

export interface OtpRecoveryVerifyPayload {
  challengeId: string;
  otp: string;
  newPassword?: string;
}

export interface OtpRecoveryVerifyResult {
  username: string | null;
  passwordReset: boolean;
  message: string;
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

    try {
      const res = await api.post<PartialAuthLoginApiResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const parsedFromLogin = toAuthUser(res.data);
      if (parsedFromLogin) {
        return parsedFromLogin;
      }

      // Fallback: if login succeeded but response body is missing/malformed,
      // use refresh cookie to retrieve a fresh auth payload.
      const refreshed = await authService.refreshFromCookie();
      if (refreshed) {
        return refreshed;
      }

      throw new Error('Login succeeded but token response was invalid. Please try again.');
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, 'Invalid email or password'));
    }
  },

  async refreshFromCookie(): Promise<AuthUser | null> {
    if (!USE_API) return null;

    try {
      const res = await api.post<PartialAuthLoginApiResponse>('/auth/refresh');
      return toAuthUser(res.data);
    } catch {
      return null;
    }
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

    let res;
    try {
      res = await api.post<AuthLoginApiResponse>('/auth/signup', {
        companyName: payload.companyName.trim(),
        contactName: payload.contactName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        password: payload.password,
      });
    } catch (error) {
      throw new Error(extractApiErrorMessage(error, 'Could not create client profile. Please check your details.'));
    }

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

  async forgotPassword(email: string): Promise<void> {
    if (!USE_API) return;
    await api.post('/auth/forgot-password', {
      email: email.trim().toLowerCase(),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!USE_API) {
      throw new Error('Password reset requires API mode');
    }
    await api.post('/auth/reset-password', {
      token: token.trim(),
      newPassword,
    });
  },

  async requestOtpRecovery(payload: OtpRecoveryRequestPayload): Promise<{ challengeId: string; message: string }> {
    if (!USE_API) {
      throw new Error('OTP recovery requires API mode');
    }
    const res = await api.post<{ challengeId: string; message: string }>('/auth/recovery/otp/request', {
      purpose: payload.purpose,
      channel: payload.channel,
      identifier: payload.identifier.trim(),
    });
    return res.data;
  },

  async verifyOtpRecovery(payload: OtpRecoveryVerifyPayload): Promise<OtpRecoveryVerifyResult> {
    if (!USE_API) {
      throw new Error('OTP recovery requires API mode');
    }
    const res = await api.post<OtpRecoveryVerifyResult>('/auth/recovery/otp/verify', {
      challengeId: payload.challengeId.trim(),
      otp: payload.otp.trim(),
      newPassword: payload.newPassword,
    });
    return res.data;
  },
};

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'Login request reached the server, but the browser could not read the response. Please refresh and try again.';
  }

  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

function toAuthUser(response: PartialAuthLoginApiResponse | undefined): AuthUser | null {
  const payload = response?.data && typeof response.data === 'object' ? response.data : response;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const roleValue = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : '';
  const role = roleValue === 'admin' || roleValue === 'client' ? roleValue : null;
  const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : '';
  const expiresInSeconds =
    typeof payload.expiresInSeconds === 'number'
      ? payload.expiresInSeconds
      : Number(payload.expiresInSeconds);

  if (!email || !role || !accessToken || !Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
    return null;
  }

  const clientId = typeof payload.clientId === 'string' ? payload.clientId : null;

  return {
    email,
    role,
    clientId,
    accessToken,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}
