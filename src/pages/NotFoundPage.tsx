import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutDashboard, FileText } from 'lucide-react';
import tvecoLogo from '../assets/tveco-logo.png';
import loginBg from '../assets/tveco-login-bg.jpg';

export function NotFoundPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0A0C0F' }}
    >
      {/* Background photo */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${loginBg})`, opacity: 0.1 }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,107,0,0.06) 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,12,15,0.8) 0%, transparent 40%, rgba(10,12,15,0.9) 100%)' }} />

      {/* Animated corner accents */}
      {/* top-left */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-8 left-8 h-0.5 w-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'left' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1, duration: 0.5 }}
        className="absolute top-8 left-8 w-0.5 h-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'top' }} />
      {/* top-right */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="absolute top-8 right-8 h-0.5 w-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'right' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
        className="absolute top-8 right-8 w-0.5 h-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'top' }} />
      {/* bottom-left */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute bottom-8 left-8 h-0.5 w-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'left' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
        className="absolute bottom-8 left-8 w-0.5 h-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'bottom' }} />
      {/* bottom-right */}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        className="absolute bottom-8 right-8 h-0.5 w-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'right' }} />
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
        className="absolute bottom-8 right-8 w-0.5 h-10 pointer-events-none"
        style={{ background: '#FF6B00', transformOrigin: 'bottom' }} />

      {/* Big watermark 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="absolute select-none pointer-events-none"
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(180px, 30vw, 340px)',
          color: 'rgba(255,107,0,0.045)',
          lineHeight: 1,
          letterSpacing: 8,
          userSelect: 'none',
        }}
      >
        404
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">

        {/* Logo */}
        <motion.img
          src={tvecoLogo}
          alt="TVECO"
          initial={{ opacity: 0, y: -16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.34, 1.1, 0.64, 1] }}
          style={{
            width: 80,
            height: 80,
            objectFit: 'contain',
            marginBottom: 24,
            filter: 'drop-shadow(0 0 20px rgba(255,107,0,0.4))',
          }}
        />

        {/* 404 label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 11,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#FF6B00',
            marginBottom: 16,
          }}
        >
          Error 404
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.45 }}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(40px, 8vw, 72px)',
            color: '#F0F4F8',
            letterSpacing: 2,
            lineHeight: 1,
            margin: '0 0 16px',
          }}
        >
          Road Ends Here
        </motion.h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          style={{ width: 48, height: 2, background: '#FF6B00', borderRadius: 2, marginBottom: 20 }}
        />

        {/* Sub-text */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 15,
            color: '#8A99AE',
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 360,
          }}
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on route.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium text-sm hover:opacity-90 active:scale-95 transition-all"
            style={{ background: '#FF6B00', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 0 24px rgba(255,107,0,0.3)' }}
          >
            <LayoutDashboard size={16} />
            Back to Dashboard
          </Link>
          <Link
            to="/invoices"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm hover:border-brand-muted active:scale-95 transition-all"
            style={{ border: '1px solid #252B35', color: '#C8D4E0', fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <FileText size={16} />
            View Invoices
          </Link>
        </motion.div>

        {/* Back link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.68, duration: 0.4 }}
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 mt-6 text-xs hover:text-brand-text transition-colors"
          style={{ color: '#8A99AE', fontFamily: "'Space Grotesk', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={13} />
          Go back to previous page
        </motion.button>

      </div>

      {/* Bottom brand strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#252B35', letterSpacing: 2 }}
      >
        TVECO · TIMELINE VEHICLE EXPORT COMPANY (PTY) LTD
      </motion.div>
    </div>
  );
}
