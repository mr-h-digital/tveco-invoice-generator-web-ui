import { Link } from 'react-router-dom';
import { ArrowRight, Shield, UserRound, UserPlus2 } from 'lucide-react';
import { motion } from 'framer-motion';
import tvecoLoginBg from '../assets/tveco-login-bg.jpg';
import tvecoLogo from '../assets/tveco-logo.png';

export function ClientAuthLandingPage() {
  const C = {
    night: '#0A0C0F',
    panel: '#131821',
    border: '#2A3342',
    muted: '#9BA8BC',
    white: '#F2F6FA',
    orange: '#FF6B00',
    deep: '#C55200',
  };

  return (
    <div
      className="client-auth-shell auth-fullscreen-shell"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.night,
        overflowX: 'hidden',
        overflowY: 'auto',
        padding: '20px 0',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${tvecoLoginBg})`, backgroundSize: 'cover', backgroundPosition: 'center 35%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 16% 22%, rgba(255,107,0,0.20) 0%, rgba(255,107,0,0.00) 42%), linear-gradient(112deg, rgba(8,10,14,0.98) 0%, rgba(9,12,16,0.90) 48%, rgba(8,10,14,0.58) 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '38px 38px', opacity: 0.25, pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative',
          zIndex: 2,
          width: 'min(980px, 94vw)',
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          background: 'linear-gradient(145deg, rgba(19,24,33,0.96) 0%, rgba(14,18,25,0.96) 100%)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.03)',
          backdropFilter: 'blur(18px)',
          overflow: 'hidden',
        }}
      >
        <div className="client-auth-stack" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 0 }}>
          <div className="client-auth-left" style={{ padding: 'clamp(24px, 4.8vw, 44px) clamp(18px, 4vw, 38px) clamp(20px, 3.8vw, 34px)', borderRight: `1px solid ${C.border}` }}>
            <img src={tvecoLogo} alt="TVECO" style={{ width: 112, height: 112, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(255,107,0,0.34))' }} />
            <h1 style={{ margin: '10px 0 6px', color: C.white, fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400, letterSpacing: 3, fontSize: 'clamp(30px, 9vw, 44px)', lineHeight: 1 }}>
              Client Zone
            </h1>
            <p style={{ margin: 0, color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 14, maxWidth: 420 }}>
              Manage your export inquiries, receive and approve quotes, upload documents, and track milestones from one premium portal.
            </p>

            <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              <CardLink
                to="/client/login"
                title="Client Login"
                subtitle="Access your existing portal account"
                icon={<UserRound size={17} />}
                accent={C.orange}
              />
              <CardLink
                to="/client/signup"
                title="Create Client Account"
                subtitle="Sign up to start your export journey"
                icon={<UserPlus2 size={17} />}
                accent={C.deep}
              />
            </div>

            <p style={{ marginTop: 22, marginBottom: 0, fontFamily: "'Outfit', sans-serif", fontSize: 12, color: C.muted }}>
              Timeline Vehicle Export Company (Pty) Ltd
            </p>
          </div>

          <div style={{ padding: 'clamp(24px, 4.8vw, 44px) clamp(18px, 3.8vw, 34px) clamp(20px, 3.8vw, 34px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', color: C.muted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, letterSpacing: 1 }}>
                Trusted export operations workflow
              </div>

              <h2 style={{ margin: '18px 0 8px', color: C.white, fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, lineHeight: 1.3 }}>
                Built for clarity between clients and operations
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {[
                  'Submit export inquiries before any job is created',
                  'Respond to admin clarification in-thread',
                  'Accept or decline formal quotes inside portal',
                  'Track milestone and document progress live',
                ].map((item) => (
                  <li key={item} style={{ color: C.muted, fontFamily: "'Outfit', sans-serif", fontSize: 13, display: 'flex', alignItems: 'start', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: C.orange, marginTop: 6 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18 }}>
              <Link to="/admin/login" style={{ color: '#D2DCE8', textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Shield size={14} /> Admin access
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`@media (max-width: 860px) {
        .client-auth-shell {
          align-items: flex-start !important;
          padding-top: max(12px, env(safe-area-inset-top, 0px)) !important;
          padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
        }

        .client-auth-stack { grid-template-columns: 1fr !important; }
        .client-auth-left { border-right: 0 !important; border-bottom: 1px solid #2A3342 !important; }
      }

      @media (max-width: 540px) {
        .client-auth-stack h2 { font-size: 19px !important; }
      }`}</style>
    </div>
  );
}

function CardLink({
  to,
  title,
  subtitle,
  icon,
  accent,
}: {
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: 'none',
        display: 'block',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        padding: '14px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
          <span style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', background: `${accent}22`, color: accent }}>
            {icon}
          </span>
          <span>
            <span style={{ display: 'block', color: '#F2F6FA', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 }}>{title}</span>
            <span style={{ display: 'block', color: '#9BA8BC', fontFamily: "'Outfit', sans-serif", fontSize: 12, marginTop: 2 }}>{subtitle}</span>
          </span>
        </div>
        <ArrowRight size={16} color="#D6E0EC" />
      </div>
    </Link>
  );
}
