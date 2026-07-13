import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { authService } from '../services/authService';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => {
    const search = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    return new URLSearchParams(search).get('token') ?? '';
  }, [location.search]);

  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
  const passwordTooWeak = password.length > 0 && !strongPasswordPattern.test(password);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error('Reset token is missing from the link.');
      return;
    }
    if (passwordTooWeak) {
      toast.error('Password must include uppercase, lowercase, number, and symbol.');
      return;
    }
    if (mismatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password updated. You can now sign in.');
      navigate('/client/login', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reset password.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const C = { night: '#0A0C0F', border: '#252B35', muted: '#8A99AE', white: '#F0F4F8', orange: '#FF6B00' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', opacity: 0.22 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(10,12,15,0.96), rgba(10,12,15,0.78))' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'rgba(17,19,24,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' }}>
          <h1 style={{ margin: 0, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontSize: 34, fontWeight: 400 }}>Set New Password</h1>
          <p style={{ margin: '8px 0 18px', color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
            Enter a strong new password for your account.
          </p>

          {!token ? (
            <p style={{ margin: '0 0 14px', color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
              This reset link is invalid. Request a new one.
            </p>
          ) : null}

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                minLength={10}
                required
                style={{ width: '100%', background: '#0A0C0F', border: `1px solid ${passwordTooWeak ? '#EF4444' : C.border}`, borderRadius: 8, padding: '12px 42px 12px 14px', color: C.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', color: C.muted, cursor: 'pointer', lineHeight: 0 }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              minLength={10}
              required
              style={{ width: '100%', background: '#0A0C0F', border: `1px solid ${mismatch ? '#EF4444' : C.border}`, borderRadius: 8, padding: '12px 14px', color: C.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, boxSizing: 'border-box' }}
            />

            {passwordTooWeak ? <p style={{ margin: 0, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>Use uppercase, lowercase, number, and symbol.</p> : null}
            {mismatch ? <p style={{ margin: 0, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>Passwords do not match.</p> : null}

            <button
              type="submit"
              disabled={submitting || !token || mismatch || passwordTooWeak}
              style={{ border: 0, borderRadius: 10, padding: '12px 14px', background: C.orange, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: submitting || !token || mismatch || passwordTooWeak ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <KeyRound size={16} />
              {submitting ? 'Updating password...' : 'Update Password'}
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <Link to="/client/login" style={{ color: C.muted, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
