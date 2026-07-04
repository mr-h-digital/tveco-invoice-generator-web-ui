import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import tvecoLogo from '../assets/tveco-logo.png';
import loginBg from '../assets/tveco-login-bg.jpg';

interface SplashScreenProps {
  onComplete: () => void;
}

// ── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div style={{ width: '100%', height: 2, background: 'rgba(255,107,0,0.15)', borderRadius: 2, overflow: 'hidden' }}>
      <motion.div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, #CC5500, #FF6B00, #FF8C35)',
          borderRadius: 2,
          boxShadow: '0 0 14px rgba(255,107,0,0.7)',
        }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      />
    </div>
  );
}

// ── Floating dot ────────────────────────────────────────────────────────────
function Dot({ x, y, delay, duration }: { x: number; y: number; delay: number; duration: number }) {
  return (
    <motion.div
      style={{
        position: 'absolute', left: `${x}%`, top: `${y}%`,
        width: 3, height: 3, borderRadius: '50%',
        background: 'rgba(255,107,0,0.3)',
        pointerEvents: 'none',
      }}
      animate={{ opacity: [0.15, 0.7, 0.15], scale: [1, 1.5, 1] }}
      transition={{ delay, duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ── Terminal line ───────────────────────────────────────────────────────────
function TerminalLine({ text, delay, color = '#4A5A6A' }: { text: string; delay: number; color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
      style={{ fontFamily: "'Space Grotesk', monospace", fontSize: 10.5, color, lineHeight: 1.9, whiteSpace: 'nowrap' }}
    >
      {text}
    </motion.div>
  );
}

// ── Stat counter ────────────────────────────────────────────────────────────
function StatCounter({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200;
      const steps = 40;
      const increment = target / steps;
      let current = 0;
      const interval = setInterval(() => {
        current = Math.min(current + increment, target);
        setCount(Math.floor(current));
        if (current >= target) clearInterval(interval);
      }, duration / steps);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [target, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      style={{ textAlign: 'center', minWidth: 72 }}
    >
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(26px, 4vw, 36px)',
        color: '#FF6B00',
        lineHeight: 1,
        letterSpacing: 1,
      }}>
        {count}{suffix}
      </div>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 9,
        color: '#5A6A7A',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginTop: 4,
      }}>
        {label}
      </div>
    </motion.div>
  );
}

// ── Corner bracket helper ───────────────────────────────────────────────────
function Corner({ pos, horiz, delay }: { pos: React.CSSProperties; horiz: boolean; delay: number }) {
  const originH = pos.left !== undefined ? 'left' : 'right';
  const originV = pos.top !== undefined ? 'top' : 'bottom';
  return (
    <motion.div
      initial={{ opacity: 0, [horiz ? 'scaleX' : 'scaleY']: 0 }}
      animate={{ opacity: 1, [horiz ? 'scaleX' : 'scaleY']: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'absolute', ...pos,
        width: horiz ? 44 : 2,
        height: horiz ? 2 : 44,
        background: '#FF6B00',
        borderRadius: 2,
        transformOrigin: horiz ? originH : originV,
        pointerEvents: 'none',
      }}
    />
  );
}

// ── Main component ──────────────────────────────────────────────────────────
const DOTS = [
  { x: 7,  y: 10, delay: 0.0, duration: 3.8 }, { x: 93, y: 7,  delay: 0.4, duration: 4.2 },
  { x: 4,  y: 88, delay: 0.8, duration: 3.4 }, { x: 96, y: 85, delay: 0.2, duration: 4.8 },
  { x: 22, y: 4,  delay: 1.2, duration: 3.2 }, { x: 78, y: 93, delay: 0.6, duration: 4.5 },
  { x: 14, y: 52, delay: 1.6, duration: 3.9 }, { x: 86, y: 47, delay: 1.0, duration: 4.1 },
  { x: 50, y: 2,  delay: 0.3, duration: 3.6 }, { x: 47, y: 96, delay: 0.9, duration: 4.7 },
  { x: 33, y: 20, delay: 1.4, duration: 3.3 }, { x: 67, y: 80, delay: 0.5, duration: 4.4 },
  { x: 73, y: 25, delay: 1.8, duration: 3.7 }, { x: 27, y: 72, delay: 1.1, duration: 4.9 },
];

const TERMINAL_LINES = [
  { text: '> connecting to TVECO workspace…',         delay: 0.3,  color: '#3A5060' },
  { text: 'import { exportDocs } from "./tveco"',     delay: 0.6,  color: '#4A6070' },
  { text: '→ loading client database…',               delay: 0.9,  color: '#3A5060' },
  { text: 'const clients = await getClients()',       delay: 1.2,  color: '#4A6070' },
  { text: '✓ 3 export clients loaded',                delay: 1.5,  color: '#FF6B00' },
  { text: 'const invoices = await getInvoices()',     delay: 1.8,  color: '#4A6070' },
  { text: '✓ invoice store hydrated',                 delay: 2.1,  color: '#FF6B00' },
  { text: '✓ TVECO dashboard ready',                  delay: 2.4,  color: '#FF8C35' },
];

const LOAD_STEPS = [
  { at: 300,  pct: 15,  text: 'Initialising workspace…'       },
  { at: 650,  pct: 32,  text: 'Loading export documents…'     },
  { at: 1050, pct: 52,  text: 'Syncing client database…'      },
  { at: 1450, pct: 70,  text: 'Preparing invoice dashboard…'  },
  { at: 1850, pct: 88,  text: 'Almost ready…'                 },
  { at: 2150, pct: 100, text: 'Ready.'                        },
];

const I = 22; // corner inset px

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress]   = useState(0);
  const [statusText, setStatusText] = useState('Initialising…');
  const [visible, setVisible]     = useState(true);
  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LOAD_STEPS.forEach(({ at, pct, text }) => {
      timers.push(setTimeout(() => { setProgress(pct); setStatusText(text); }, at));
    });
    timers.push(setTimeout(() => setShowReady(true), 2200));
    timers.push(setTimeout(() => setVisible(false),  2750));
    timers.push(setTimeout(onComplete,               3350));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="tveco-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#0A0C0F',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >

          {/* ── Background: TVECO truck photo ── */}
          <motion.div
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${loginBg})`,
              backgroundSize: 'cover', backgroundPosition: 'center 42%',
              pointerEvents: 'none',
            }}
          />

          {/* ── Cinematic overlays ── */}
          {/* Luminosity desaturate */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,12,15,0.60)', mixBlendMode: 'multiply', pointerEvents: 'none' }} />
          {/* Orange vignette left */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(255,107,0,0.12) 0%, transparent 45%)', pointerEvents: 'none' }} />
          {/* Dark vignette edges */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(10,12,15,0.85) 100%)', pointerEvents: 'none' }} />
          {/* Top + bottom fade */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,12,15,0.7) 0%, transparent 25%, transparent 70%, rgba(10,12,15,0.9) 100%)', pointerEvents: 'none' }} />

          {/* ── Floating dots ── */}
          {DOTS.map((d, i) => <Dot key={i} {...d} />)}

          {/* ── Orange radial glow behind logo ── */}
          <div style={{
            position: 'absolute',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />

          {/* ── Corner brackets ── */}
          <Corner pos={{ top: I, left: I }}     horiz={true}  delay={0.10} />
          <Corner pos={{ top: I, left: I }}     horiz={false} delay={0.10} />
          <Corner pos={{ top: I, right: I }}    horiz={true}  delay={0.15} />
          <Corner pos={{ top: I, right: I }}    horiz={false} delay={0.15} />
          <Corner pos={{ bottom: I, left: I }}  horiz={true}  delay={0.20} />
          <Corner pos={{ bottom: I, left: I }}  horiz={false} delay={0.20} />
          <Corner pos={{ bottom: I, right: I }} horiz={true}  delay={0.25} />
          <Corner pos={{ bottom: I, right: I }} horiz={false} delay={0.25} />

          {/* ── Left: Terminal card (desktop only) ── */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: 88, left: 52,
              background: 'rgba(17,19,24,0.75)',
              border: '1px solid rgba(255,107,0,0.15)',
              borderRadius: 10, padding: '14px 20px',
              backdropFilter: 'blur(12px)',
              minWidth: 290,
            }}
          >
            {/* Traffic lights */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              {['#EF4444', '#F59E0B', '#FF6B00'].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.8 }} />
              ))}
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#3A5060', marginLeft: 6, letterSpacing: 1 }}>
                tveco — terminal
              </span>
            </div>
            {TERMINAL_LINES.map((l, i) => <TerminalLine key={i} {...l} />)}
          </motion.div>

          {/* ── Right: Stat counters (desktop only) ── */}
          <motion.div
            className="hidden lg:flex"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: 88, right: 52,
              background: 'rgba(17,19,24,0.75)',
              border: '1px solid rgba(255,107,0,0.15)',
              borderRadius: 10, padding: '20px 28px',
              backdropFilter: 'blur(12px)',
              display: 'flex', gap: 28, alignItems: 'center',
            }}
          >
            <StatCounter target={20} suffix="+"  label="Yrs Experience" delay={0.8} />
            <div style={{ width: 1, height: 36, background: 'rgba(255,107,0,0.2)' }} />
            <StatCounter target={50} suffix="+"  label="Countries"      delay={1.0} />
            <div style={{ width: 1, height: 36, background: 'rgba(255,107,0,0.2)' }} />
            <StatCounter target={500} suffix="+" label="Vehicles"       delay={1.2} />
          </motion.div>

          {/* ── Centre: Main content ── */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            padding: '0 24px', width: '100%', maxWidth: 520,
          }}>

            {/* Logo */}
            <motion.img
              src={tvecoLogo}
              alt="TVECO"
              initial={{ opacity: 0, scale: 0.7, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65, ease: [0.34, 1.4, 0.64, 1] }}
              style={{
                width: 'clamp(80px, 16vw, 110px)',
                height: 'clamp(80px, 16vw, 110px)',
                objectFit: 'contain',
                marginBottom: 18,
                filter: 'drop-shadow(0 0 28px rgba(255,107,0,0.55)) drop-shadow(0 0 8px rgba(255,107,0,0.3))',
              }}
            />

            {/* TVECO wordmark */}
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5, ease: 'easeOut' }}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 'clamp(52px, 12vw, 86px)',
                color: '#F0F4F8',
                lineHeight: 1,
                letterSpacing: 6,
                margin: 0,
              }}
            >
              TVECO
            </motion.h1>

            {/* Sub-label with flanking lines */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}
            >
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ height: 1, width: 32, background: 'rgba(255,107,0,0.45)', transformOrigin: 'right' }}
              />
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 'clamp(9px, 2vw, 11px)',
                letterSpacing: 3, textTransform: 'uppercase',
                color: '#FF6B00',
              }}>
                Invoice Generator
              </span>
              <motion.div
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                style={{ height: 1, width: 32, background: 'rgba(255,107,0,0.45)', transformOrigin: 'left' }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 300,
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                color: '#5A6A7A',
                marginTop: 10,
                letterSpacing: 0.3,
              }}
            >
              Timeline Vehicle Export Company (Pty) Ltd
            </motion.p>

            {/* Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              style={{ width: '100%', maxWidth: 280, marginTop: 44 }}
            >
              <ProgressBar progress={progress} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9 }}>
                <motion.span
                  key={statusText}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#5A6A7A', letterSpacing: 0.5 }}
                >
                  {statusText}
                </motion.span>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#FF6B00', letterSpacing: 0.5 }}>
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* "Ready" flash */}
            <AnimatePresence>
              {showReady && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    marginTop: 20,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 11, letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: '#FF6B00',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {/* Pulsing dot */}
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B00' }}
                  />
                  Ready
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Bottom brand strip ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: I + 8, left: 0, right: 0,
              display: 'flex', justifyContent: 'center',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
              color: 'rgba(255,107,0,0.25)',
            }}
          >
            Centurion · Gauteng · South Africa &nbsp;·&nbsp; tveco.co.za
          </motion.div>

          {/* ── Version tag ── */}
          <motion.div
            className="hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            style={{
              position: 'absolute', bottom: I + 6, right: I + 16,
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 9, color: 'rgba(255,107,0,0.2)', letterSpacing: 2,
            }}
          >
            v1.0.0
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
