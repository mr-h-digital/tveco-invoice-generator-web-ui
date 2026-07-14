import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LockKeyhole, Save } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { useAuthStore } from '../store/authStore';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/profile';

export function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUserEmail = useAuthStore((s) => s.updateUserEmail);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [form, setForm] = useState({
    email: '',
    companyName: '',
    contactName: '',
    phone: '',
    address: '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const passwordTooWeak = useMemo(() => {
    if (!pwForm.newPassword) return false;
    return !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(pwForm.newPassword);
  }, [pwForm.newPassword]);

  const passwordMismatch = pwForm.confirmPassword.length > 0 && pwForm.newPassword !== pwForm.confirmPassword;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await profileService.getMyProfile();
        if (!mounted) return;
        setProfile(p);
        setForm({
          email: p.email ?? '',
          companyName: p.companyName ?? '',
          contactName: p.contactName ?? '',
          phone: p.phone ?? '',
          address: p.address ?? '',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not load profile';
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await profileService.updateMyProfile({
        email: form.email.trim().toLowerCase(),
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
        address: form.address,
      });
      setProfile(updated);
      updateUserEmail(updated.email);
      toast.success('Profile updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordTooWeak) {
      toast.error('New password must include uppercase, lowercase, number, symbol, and at least 10 chars.');
      return;
    }
    if (passwordMismatch) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated. Please sign in again.');
      await useAuthStore.getState().logout();
      navigate('/client-zone/auth', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not change password';
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 text-brand-text">Loading profile...</div>
    );
  }

  const isClient = (profile?.role ?? user?.role) === 'client';
  const backHref = isClient ? '/client-zone' : '/dashboard';

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {!isClient ? <TopBar title="Profile Settings" subtitle="Keep your account details up to date" /> : null}

      <div className="p-4 sm:p-6 grid gap-4 max-w-4xl w-full mx-auto">
        {isClient ? (
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl tracking-wide text-brand-white">Profile Settings</h1>
            <Link to={backHref} className="text-sm text-brand-muted hover:text-brand-white">Back to portal</Link>
          </div>
        ) : null}

        {isClient && profile ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card-alt p-4 sm:p-5 grid gap-4">
            <h2 className="font-head text-lg text-brand-white">Current Profile Information</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="field-label">Email</p>
                <p className="text-brand-text">{profile.email || '—'}</p>
              </div>
              <div>
                <p className="field-label">Contact Name</p>
                <p className="text-brand-text">{profile.contactName || '—'}</p>
              </div>
              <div>
                <p className="field-label">Company Name</p>
                <p className="text-brand-text">{profile.companyName || '—'}</p>
              </div>
              <div>
                <p className="field-label">Phone</p>
                <p className="text-brand-text">{profile.phone || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="field-label">Address</p>
                <p className="text-brand-text">{profile.address || '—'}</p>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={saveProfile} className="rounded-2xl border border-brand-border bg-brand-card p-4 sm:p-5 grid gap-4">
          <div className="grid gap-1">
            <h2 className="font-head text-lg text-brand-white">Account Details</h2>
            <p className="text-xs text-brand-muted">Update only the fields you want to change. All fields are optional.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="field-label">Email</span>
              <input className="input-field" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </label>

            {isClient ? (
              <label>
                <span className="field-label">Contact Name</span>
                <input className="input-field" value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} />
              </label>
            ) : null}

            {isClient ? (
              <label>
                <span className="field-label">Company Name</span>
                <input className="input-field" value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} />
              </label>
            ) : null}

            {isClient ? (
              <label>
                <span className="field-label">Phone</span>
                <input className="input-field" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </label>
            ) : null}
          </div>

          {isClient ? (
            <label>
              <span className="field-label">Address</span>
              <input className="input-field" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </label>
          ) : null}

          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium" style={{ background: '#FF6B00' }}>
              <Save size={15} />
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        <form onSubmit={changePassword} className="rounded-2xl border border-brand-border bg-brand-card p-4 sm:p-5 grid gap-4">
          <h2 className="font-head text-lg text-brand-white">Security</h2>

          <label>
            <span className="field-label">Current Password</span>
            <input className="input-field" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
          </label>

          <label>
            <span className="field-label">New Password</span>
            <input className="input-field" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} required minLength={10} />
          </label>

          <label>
            <span className="field-label">Confirm New Password</span>
            <input className="input-field" type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} required minLength={10} />
          </label>

          {passwordTooWeak ? <p className="field-error">Password must include uppercase, lowercase, number, symbol, and be at least 10 characters.</p> : null}
          {passwordMismatch ? <p className="field-error">New password and confirmation do not match.</p> : null}

          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword || passwordTooWeak || passwordMismatch} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium" style={{ background: '#CC5500' }}>
              <LockKeyhole size={15} />
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
