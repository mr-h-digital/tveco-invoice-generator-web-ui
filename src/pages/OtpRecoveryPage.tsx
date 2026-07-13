import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, type OtpRecoveryRequestPayload } from '../services/authService';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';

type RecoveryPurpose = 'USERNAME_RECOVERY' | 'PASSWORD_RESET';
type RecoveryChannel = 'EMAIL' | 'SMS' | 'WHATSAPP';

export function OtpRecoveryPage() {
  const [purpose, setPurpose] = useState<RecoveryPurpose>('USERNAME_RECOVERY');
  const [channel, setChannel] = useState<RecoveryChannel>('EMAIL');
  const [identifier, setIdentifier] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null);

  const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
  const passwordTooWeak = purpose === 'PASSWORD_RESET' && newPassword.length > 0 && !strongPasswordPattern.test(newPassword);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingRequest(true);
    setResolvedUsername(null);
    try {
      const payload: OtpRecoveryRequestPayload = { purpose, channel, identifier };
      const response = await authService.requestOtpRecovery(payload);
      setChallengeId(response.challengeId);
      toast.success(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not request OTP.';
      toast.error(message);
    } finally {
      setSubmittingRequest(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challengeId) {
      toast.error('Request OTP first.');
      return;
    }
    if (purpose === 'PASSWORD_RESET' && passwordTooWeak) {
      toast.error('Password must include uppercase, lowercase, number, and symbol.');
      return;
    }

    setSubmittingVerify(true);
    try {
      const response = await authService.verifyOtpRecovery({
        challengeId,
        otp,
        newPassword: purpose === 'PASSWORD_RESET' ? newPassword : undefined,
      });
      setResolvedUsername(response.username);
      toast.success(response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OTP verification failed.';
      toast.error(message);
    } finally {
      setSubmittingVerify(false);
    }
  }

  const C = { night: '#0A0C0F', border: '#252B35', muted: '#8A99AE', white: '#F0F4F8', orange: '#FF6B00' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', opacity: 0.22 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(10,12,15,0.96), rgba(10,12,15,0.78))' }} />

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'rgba(17,19,24,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 20px' }}>
          <h1 style={{ margin: 0, color: C.white, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontSize: 34, fontWeight: 400 }}>OTP Recovery</h1>
          <p style={{ margin: '8px 0 18px', color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
            Recover username or reset password using a one-time code via Email, SMS, or WhatsApp.
          </p>

          <form onSubmit={requestOtp} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: C.muted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 1.4 }}>Recovery purpose</span>
              <select value={purpose} onChange={(e) => setPurpose(e.target.value as RecoveryPurpose)} style={inputStyle(C)}>
                <option value="USERNAME_RECOVERY">Recover username</option>
                <option value="PASSWORD_RESET">Reset password</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: C.muted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 1.4 }}>Channel</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value as RecoveryChannel)} style={inputStyle(C)}>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={channel === 'EMAIL' ? 'you@company.com' : '+27... phone number'}
              required
              style={inputStyle(C)}
            />

            <button type="submit" disabled={submittingRequest} style={primaryButtonStyle(C, submittingRequest)}>
              {submittingRequest ? 'Sending OTP...' : 'Request OTP'}
            </button>
          </form>

          {challengeId ? (
            <form onSubmit={verifyOtp} style={{ display: 'grid', gap: 12, marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              <input value={challengeId} readOnly style={{ ...inputStyle(C), opacity: 0.8 }} />
              <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" required maxLength={6} style={inputStyle(C)} />

              {purpose === 'PASSWORD_RESET' ? (
                <>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    minLength={10}
                    required
                    style={{ ...inputStyle(C), border: `1px solid ${passwordTooWeak ? '#EF4444' : C.border}` }}
                  />
                  {passwordTooWeak ? <p style={{ margin: 0, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>Use uppercase, lowercase, number, and symbol.</p> : null}
                </>
              ) : null}

              <button type="submit" disabled={submittingVerify || passwordTooWeak} style={primaryButtonStyle(C, submittingVerify || passwordTooWeak)}>
                {submittingVerify ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          ) : null}

          {resolvedUsername ? (
            <p style={{ marginTop: 14, color: '#86EFAC', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
              Username recovered: {resolvedUsername}
            </p>
          ) : null}

          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            <Link to="/client/login" style={{ color: C.white, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
              Back to client login
            </Link>
            <Link to="/forgot-password" style={{ color: C.muted, textDecoration: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 12 }}>
              Prefer email reset link instead?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputStyle(C: { border: string; white: string }) {
  return {
    width: '100%',
    background: '#0A0C0F',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '12px 14px',
    color: C.white,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 14,
    boxSizing: 'border-box' as const,
  };
}

function primaryButtonStyle(C: { orange: string }, disabled: boolean) {
  return {
    border: 0,
    borderRadius: 10,
    padding: '12px 14px',
    background: C.orange,
    color: '#fff',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.85 : 1,
  };
}
