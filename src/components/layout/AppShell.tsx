import { useState, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import tvecoLogo from '../../assets/tveco-logo.png';
import navBg from '../../assets/tveco-nav-bg.jpg';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  return (
    <div className="flex min-h-screen print:min-h-0 bg-brand-night print:bg-transparent">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onNavClick={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main ref={mainRef} className="flex-1 min-w-0 flex flex-col print:overflow-visible">
        {/* Mobile top bar */}
        <div
          className="relative flex items-center justify-between px-4 py-3 border-b border-brand-border/60 lg:hidden print:hidden sticky top-0 z-30"
          style={{ backgroundImage: `url(${navBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-brand-night/90 pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2.5 rounded-lg text-brand-text hover:bg-white/10 transition-colors"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <img src={tvecoLogo} alt="TVECO" className="w-8 h-8 object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,107,0,0.4))' }} />
            <span className="font-display text-xl text-brand-white tracking-wider">TVECO</span>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
