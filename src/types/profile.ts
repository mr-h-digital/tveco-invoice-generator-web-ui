export interface UserProfile {
  email: string;
  role: 'admin' | 'client';
  companyName: string | null;
  contactName: string | null;
  phone: string | null;
  address: string | null;
}

export interface UpdateProfilePayload {
  email: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
