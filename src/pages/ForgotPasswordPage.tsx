import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { authService } from '../services/authService';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      toast.success('If the account exists, a reset link has been sent to your email.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start password reset.';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const C = { night: '#0A0C0F', border: '#252B35', muted: '#8A99AE', white: '#F0F4F8', orange: '#FF6B00' };

  return (
    <div className="auth-fullscreen-shell" style={{ position: 'fixed', inset: 0, background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', opacity: 0.25 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(10,12,15,0.96), rgba(10,12,15,0.78))' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'rgba(17,19,24,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' }}>
          <h1 style={{ margin: 0, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontSize: 34, fontWeight: 400 }}>Forgot Password</h1>
          <p style={{ margin: '8px 0 18px', color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
            Enter your account email and we will send a secure reset link.
          </p>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ color: C.muted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 1.4 }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{ width: '100%', background: '#0A0C0F', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px', color: C.white, fontFamily: "'Outfit', sans-serif", fontSize: 14, boxSizing: 'border-box' }}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              style={{ border: 0, borderRadius: 10, padding: '12px 14px', background: C.orange, color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <MailCheck size={16} />
              {submitting ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            <Link to="/client/login" style={{ color: C.white, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to client login
            </Link>
            <Link to="/auth/recovery/otp" style={{ color: C.muted, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
              Need username recovery or OTP reset instead?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
