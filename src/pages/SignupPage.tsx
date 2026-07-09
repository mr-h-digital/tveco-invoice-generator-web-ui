import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';

export function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
  const passwordsDoNotMatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const passwordTooWeak = form.password.length > 0 && !strongPasswordPattern.test(form.password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (passwordTooWeak) {
      toast.error('Password must include uppercase, lowercase, number, and symbol.');
      return;
    }
    if (passwordsDoNotMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await signup({
      companyName: form.companyName,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      password: form.password,
    });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.message ?? 'Could not create client profile. Please check your details.');
      return;
    }

    toast.success('Profile created. Welcome to your client zone.');
  }

  const C = { night: '#0A0C0F', card: '#181C23', border: '#252B35', muted: '#8A99AE', white: '#F0F4F8', orange: '#FF6B00' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.night, overflowY: 'auto' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,12,15,0.97) 0%, rgba(10,12,15,0.88) 45%, rgba(10,12,15,0.6) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 520, margin: '24px 16px' }}>
        <div style={{ background: 'rgba(17,19,24,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '28px 24px' }}>
          <h1 style={{ margin: 0, color: C.white, fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, letterSpacing: 2, fontSize: 34 }}>
            Client Zone Sign Up
          </h1>
          <p style={{ marginTop: 8, color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
            Create your profile to submit export requests, track progress, and upload required documents.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            <input value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company Name" required style={inputStyle(C)} />
            <input value={form.contactName} onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))} placeholder="Contact Name" required style={inputStyle(C)} />
            <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" required style={inputStyle(C)} />
            <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" required style={inputStyle(C)} />
            <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="Business Address" required style={inputStyle(C)} />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Password (min 10, upper/lower/number/symbol)"
                minLength={10}
                required
                aria-invalid={passwordTooWeak}
                style={passwordInputStyle(C)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={toggleButtonStyle(C)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm Password"
                minLength={10}
                required
                aria-invalid={passwordsDoNotMatch}
                style={{
                  ...passwordInputStyle(C),
                  border: passwordsDoNotMatch ? '1px solid #EF4444' : `1px solid ${C.border}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                style={toggleButtonStyle(C)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {passwordTooWeak ? (
              <p style={{ margin: 0, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
                Use at least 10 characters with uppercase, lowercase, number, and symbol.
              </p>
            ) : null}

            {passwordsDoNotMatch ? (
              <p style={{ margin: 0, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
                Password and confirm password must match.
              </p>
            ) : null}

            <button type="submit" disabled={loading || passwordsDoNotMatch || passwordTooWeak} style={{ border: 'none', borderRadius: 10, padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: C.orange, color: '#fff', cursor: loading || passwordsDoNotMatch || passwordTooWeak ? 'not-allowed' : 'pointer', opacity: loading || passwordsDoNotMatch || passwordTooWeak ? 0.8 : 1 }}>
              {loading ? 'Creating profile...' : 'Create Client Profile'}
            </button>
          </form>

          <p style={{ marginTop: 14, color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
            Already have an account? <Link to="/login" style={{ color: C.orange, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function passwordInputStyle(C: { border: string; white: string }) {
  return {
    ...inputStyle(C),
    paddingRight: 42,
  };
}

function toggleButtonStyle(C: { muted: string }) {
  return {
    position: 'absolute' as const,
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: 0,
    color: C.muted,
    cursor: 'pointer',
    lineHeight: 0,
  };
}

function inputStyle(C: { border: string; white: string }) {
  return {
    width: '100%',
    background: '#0A0C0F',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: "'Outfit', sans-serif",
    color: C.white,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };
}
