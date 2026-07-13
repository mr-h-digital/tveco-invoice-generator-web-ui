import api from './api';
import type { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '../types/profile';
import { loadAuthSession, saveAuthSession } from './authSession';

const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;

export const profileService = {
  async getMyProfile(): Promise<UserProfile> {
    if (!USE_API) {
      const session = loadAuthSession();
      if (!session) {
        throw new Error('Not signed in');
      }
      return {
        email: session.email,
        role: session.role,
        companyName: null,
        contactName: null,
        phone: null,
        address: null,
      };
    }

    const res = await api.get<UserProfile>('/profile/me');
    return res.data;
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    if (!USE_API) {
      const session = loadAuthSession();
      if (!session) {
        throw new Error('Not signed in');
      }
      const nextEmail = payload.email.trim().toLowerCase();
      saveAuthSession({ ...session, email: nextEmail });
      return {
        email: nextEmail,
        role: session.role,
        companyName: payload.companyName ?? null,
        contactName: payload.contactName ?? null,
        phone: payload.phone ?? null,
        address: payload.address ?? null,
      };
    }

    const res = await api.patch<UserProfile>('/profile/me', payload);
    return res.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (!USE_API) {
      return;
    }
    await api.post('/profile/change-password', payload);
  },
};
