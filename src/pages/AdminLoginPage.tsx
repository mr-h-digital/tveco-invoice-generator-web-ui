import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';
import tvecoLogo from '../assets/tveco-logo.png';
import mrhLogo from '../assets/mrh-digital-logo.png';

export function AdminLoginPage() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message ?? 'Invalid email or password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  const C = { night: '#0A0C0F', dark: '#111318', card: '#181C23', border: '#252B35', muted: '#8A99AE', white: '#F0F4F8', orange: '#FF6B00' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.night, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,12,15,0.97) 0%, rgba(10,12,15,0.88) 45%, rgba(10,12,15,0.55) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to top, rgba(10,12,15,1), transparent)', pointerEvents: 'none' }} />

      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 0.45 }} style={{ position: 'absolute', top: 28, left: 28, width: 40, height: 2, background: C.orange, borderRadius: 2, transformOrigin: 'left' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1, duration: 0.45 }} style={{ position: 'absolute', top: 28, left: 28, width: 2, height: 40, background: C.orange, borderRadius: 2, transformOrigin: 'top' }} />
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15, duration: 0.45 }} style={{ position: 'absolute', top: 28, right: 28, width: 40, height: 2, background: C.orange, borderRadius: 2, transformOrigin: 'right' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.15, duration: 0.45 }} style={{ position: 'absolute', top: 28, right: 28, width: 2, height: 40, background: C.orange, borderRadius: 2, transformOrigin: 'top' }} />
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 0.45 }} style={{ position: 'absolute', bottom: 28, left: 28, width: 40, height: 2, background: C.orange, borderRadius: 2, transformOrigin: 'left' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2, duration: 0.45 }} style={{ position: 'absolute', bottom: 28, left: 28, width: 2, height: 40, background: C.orange, borderRadius: 2, transformOrigin: 'bottom' }} />
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.25, duration: 0.45 }} style={{ position: 'absolute', bottom: 28, right: 28, width: 40, height: 2, background: C.orange, borderRadius: 2, transformOrigin: 'right' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.25, duration: 0.45 }} style={{ position: 'absolute', bottom: 28, right: 28, width: 2, height: 40, background: C.orange, borderRadius: 2, transformOrigin: 'bottom' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, margin: '0 16px' }}
      >
        <motion.div animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }} transition={{ duration: 0.45, ease: 'easeInOut' }}>
          <div style={{ background: 'rgba(17,19,24,0.95)', border: `1px solid ${C.border}`, borderRadius: 16, padding: '40px 40px 36px', backdropFilter: 'blur(20px)', boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,107,0,0.06)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
              <motion.img src={tvecoLogo} alt="TVECO" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }} style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 12, filter: 'drop-shadow(0 0 20px rgba(255,107,0,0.35))' }} />
              <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, fontSize: 28, color: C.white, margin: '0 0 2px', letterSpacing: 3 }}>
                Operations Hub
              </motion.h1>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45, duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 1, width: 24, background: C.border }} />
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: C.muted }}>
                  Admin access
                </span>
                <div style={{ height: 1, width: 24, background: C.border }} />
              </motion.div>
            </div>

            <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="admin@tveco.co.za"
                  autoComplete="username"
                  required
                  style={{ width: '100%', background: '#0A0C0F', border: `1px solid ${error ? '#EF4444' : C.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 14, fontFamily: "'Outfit', sans-serif", color: C.white, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    style={{ width: '100%', background: '#0A0C0F', border: `1px solid ${error ? '#EF4444' : C.border}`, borderRadius: 8, padding: '12px 44px 12px 14px', fontSize: 14, fontFamily: "'Outfit', sans-serif", color: C.white, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2, display: 'flex', alignItems: 'center' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -4, height: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontFamily: "'Outfit', sans-serif", fontSize: 13 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }} style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: loading ? '#CC5500' : C.orange, color: '#fff', border: 'none', borderRadius: 8, padding: '13px 20px', fontSize: 15, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(255,107,0,0.3)', transition: 'background 0.2s, box-shadow 0.2s', letterSpacing: 0.3 }}>
                {loading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Sign In
                  </>
                )}
              </motion.button>
            </motion.form>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4 }} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.muted, textAlign: 'center', margin: '28px 0 0' }}>
              Timeline Vehicle Export Company (Pty) Ltd
            </motion.p>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4 }} style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.muted, textAlign: 'center', margin: '8px 0 0' }}>
              Looking for Client Zone?{' '}
              <Link to="/login" style={{ color: C.orange, textDecoration: 'none', fontWeight: 600 }}>
                Client login
              </Link>
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: '#5A6478' }}>Built by</span>
              <img src={mrhLogo} alt="Mr. H Digital" style={{ height: 22, width: 'auto', opacity: 0.65, filter: 'brightness(1.1)' }} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <div style={{ position: 'absolute', bottom: 20, right: 32, fontFamily: "'Space Grotesk', monospace", fontSize: 10, color: C.border, letterSpacing: 1, zIndex: 1 }}>
        v1.0.0
      </div>
    </div>
  );
}
