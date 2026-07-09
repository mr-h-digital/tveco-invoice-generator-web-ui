import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Compass, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import tvecoLogo from '../../assets/tveco-logo.png';
import navBg from '../../assets/tveco-nav-bg.jpg';
import { Modal } from '../shared/Modal';
import { ROUTE_TIPS, TOUR_STEPS } from '../../constants/onboardingTour';
import { useOnboardingStore } from '../../store/onboardingStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const tourCardRef = useRef<HTMLDivElement>(null);
  const lastAutoScrollKeyRef = useRef('');
  const navigate = useNavigate();
  const location = useLocation();

  const welcomeOpen = useOnboardingStore((s) => s.welcomeOpen);
  const tutorialMode = useOnboardingStore((s) => s.tutorialMode);
  const tourActive = useOnboardingStore((s) => s.tourActive);
  const tourStepIndex = useOnboardingStore((s) => s.tourStepIndex);
  const lastTourStepIndex = useOnboardingStore((s) => s.lastTourStepIndex);
  const hasSeenWelcome = useOnboardingStore((s) => s.hasSeenWelcome);
  const hasCompletedTour = useOnboardingStore((s) => s.hasCompletedTour);
  const startTour = useOnboardingStore((s) => s.startTour);
  const resumeTour = useOnboardingStore((s) => s.resumeTour);
  const skipTour = useOnboardingStore((s) => s.skipTour);
  const nextTourStep = useOnboardingStore((s) => s.nextTourStep);
  const prevTourStep = useOnboardingStore((s) => s.prevTourStep);
  const setTutorialMode = useOnboardingStore((s) => s.setTutorialMode);

  const currentStep = TOUR_STEPS[tourStepIndex];
  const tipText = ROUTE_TIPS[location.pathname];
  const hasResumeProgress = hasSeenWelcome && !hasCompletedTour && lastTourStepIndex > 0;

  useEffect(() => {
    if (!tourActive || !currentStep) return;
    if (location.pathname !== currentStep.path) {
      navigate(currentStep.path);
    }
  }, [tourActive, currentStep, location.pathname, navigate]);

  function handleWelcomeStartTour() {
    startTour();
  }

  function handleWelcomeResumeTour() {
    resumeTour();
  }

  function handleWelcomeSkip() {
    skipTour();
  }

  function handleTourNext() {
    nextTourStep();
  }

  function handleTourPrevious() {
    prevTourStep();
  }

  function handleTourSkip() {
    skipTour();
  }

  useEffect(() => {
    if (!tourActive || !currentStep) {
      setSpotlightRect(null);
      lastAutoScrollKeyRef.current = '';
      return;
    }

    let frame = 0;

    function updateRect() {
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${currentStep.targetId}"]`);
      if (!target) {
        setSpotlightRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 8;

      setSpotlightRect({
        left: Math.max(6, rect.left - padding),
        top: Math.max(6, rect.top - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    }

    function requestUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateRect);
    }

    requestUpdate();
    window.addEventListener('resize', requestUpdate);
    window.addEventListener('scroll', requestUpdate, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', requestUpdate);
      window.removeEventListener('scroll', requestUpdate, true);
    };
  }, [tourActive, currentStep, location.pathname]);

  useEffect(() => {
    if (!tourActive || !currentStep) return;

    const key = `${location.pathname}:${tourStepIndex}:${currentStep.targetId}`;
    if (lastAutoScrollKeyRef.current === key) return;

    const target = document.querySelector<HTMLElement>(`[data-tour-id="${currentStep.targetId}"]`);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    const cardHeight = tourCardRef.current?.getBoundingClientRect().height ?? 200;
    const safeTop = 88; // mobile sticky top bar + breathing room
    const safeBottom = isMobile
      ? Math.min(Math.max(cardHeight + 28, 170), Math.floor(viewportHeight * 0.58))
      : 76;
    const isAbove = rect.top < safeTop;
    const isBelow = rect.bottom > viewportHeight - safeBottom;

    if (isAbove || isBelow) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      window.setTimeout(() => {
        const updated = target.getBoundingClientRect();
        const padding = 8;
        setSpotlightRect({
          left: Math.max(6, updated.left - padding),
          top: Math.max(6, updated.top - padding),
          width: updated.width + padding * 2,
          height: updated.height + padding * 2,
        });
      }, 260);
    }

    lastAutoScrollKeyRef.current = key;
  }, [tourActive, currentStep, location.pathname, tourStepIndex]);

  return (
    <>
    <div className="flex min-h-screen print:min-h-0 bg-brand-night print:bg-transparent">

      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
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

        {/* ── Mobile nav strip (hamburger + logo only) ── */}
        <div
          className="relative flex items-center px-3 py-2.5 border-b border-brand-border/60 lg:hidden print:hidden sticky top-0 z-30"
          style={{ backgroundImage: `url(${navBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-brand-night/90 pointer-events-none" />
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="p-2.5 rounded-lg text-brand-text hover:bg-white/10 active:bg-white/20 transition-colors"
              aria-label={drawerOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <img
              src={tvecoLogo}
              alt="TVECO"
              className="w-7 h-7 object-contain"
              style={{ filter: 'drop-shadow(0 0 5px rgba(255,107,0,0.45))' }}
            />
            <span
              className="font-display text-lg text-brand-white tracking-wider leading-none"
              aria-hidden="true"
            >
              TVECO
            </span>
          </div>
        </div>

        {children}
      </main>
    </div>

    <Modal open={welcomeOpen} onClose={handleWelcomeSkip} title="Welcome to TVECO Operations Hub" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-brand-text leading-relaxed">
          {hasResumeProgress
            ? `You paused your guided tour at step ${lastTourStepIndex + 1}. Resume where you left off or restart from the beginning.`
            : 'Would you like a quick guided tour of the key workflows: clients, quotes, exports, invoices, and analytics?'}
        </p>

        <div className="rounded-xl border border-brand-border bg-brand-card2 p-4">
          <p className="text-xs uppercase tracking-wide text-brand-muted mb-2">What you will cover</p>
          <ul className="text-sm text-brand-text space-y-1.5">
            <li>1. Set up and manage clients</li>
            <li>2. Create and send quotes</li>
            <li>3. Create and track export jobs</li>
            <li>4. Generate milestone invoices</li>
            <li>5. Review analytics and reports</li>
          </ul>
        </div>

        <label className="flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={tutorialMode}
            onChange={(e) => setTutorialMode(e.target.checked)}
            className="accent-orange"
          />
          Enable tutorial tips while using the app
        </label>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button
            onClick={handleWelcomeSkip}
            className="px-4 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-brand-card2 transition-colors"
          >
            Skip for now
          </button>
          {hasResumeProgress && (
            <button
              onClick={handleWelcomeResumeTour}
              className="px-4 py-2 rounded-lg border border-brand-border text-brand-white hover:bg-brand-card2 transition-colors"
            >
              Resume Tour
            </button>
          )}
          <button
            onClick={handleWelcomeStartTour}
            className="px-4 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
            style={{ background: '#FF6B00' }}
          >
            {hasResumeProgress ? 'Restart Tour' : 'Start Tour'}
          </button>
        </div>
      </div>
    </Modal>

    <AnimatePresence>
      {tourActive && currentStep && (
        <motion.div
          ref={tourCardRef}
          key="tour-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.22 }}
          className="fixed right-3 left-3 sm:left-auto sm:right-6 bottom-4 sm:bottom-6 z-[85] w-auto sm:w-[420px]"
        >
          <div className="rounded-2xl border border-brand-border bg-brand-card/95 backdrop-blur-md shadow-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-wide text-brand-muted">
                Guided Tour {tourStepIndex + 1}/{TOUR_STEPS.length}
              </p>
              <button
                onClick={handleTourSkip}
                className="text-xs text-brand-muted hover:text-brand-white transition-colors"
              >
                End tour
              </button>
            </div>
            <h3 className="text-brand-white font-head font-bold text-base mb-1">{currentStep.title}</h3>
            <p className="text-sm text-brand-text mb-3">{currentStep.description}</p>
            <p className="text-xs text-brand-muted mb-4">Next action: {currentStep.actionLabel}</p>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleTourPrevious}
                disabled={tourStepIndex === 0}
                className="px-3 py-1.5 rounded-lg border border-brand-border text-sm text-brand-text enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleTourNext}
                className="px-3 py-1.5 rounded-lg text-sm text-white font-medium hover:opacity-90 transition-opacity"
                style={{ background: '#FF6B00' }}
              >
                {tourStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {tourActive && spotlightRect && (
        <>
          <motion.div
            key="spotlight-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[75] pointer-events-none bg-black/10"
          />
          <motion.div
            key="spotlight-ring"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: spotlightRect.left,
              top: spotlightRect.top,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[80] rounded-xl pointer-events-none"
            style={{
              boxShadow:
                '0 0 0 1px rgba(255,107,0,0.9), 0 0 0 9999px rgba(9,12,18,0.72), 0 0 28px rgba(255,107,0,0.45)',
            }}
          />
        </>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {tutorialMode && !tourActive && tipText && (
        <motion.div
          key="tutorial-tip"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[360px] bottom-4 z-[60]"
        >
          <div className="rounded-xl border border-brand-border bg-brand-card/95 backdrop-blur-sm p-3.5 shadow-xl">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
                <Compass size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-brand-muted mb-1">Tutorial Tip</p>
                <p className="text-sm text-brand-text leading-snug">{tipText}</p>
              </div>
              <button
                onClick={() => setTutorialMode(false)}
                className="text-xs text-brand-muted hover:text-brand-white transition-colors"
              >
                Turn off
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {!tourActive && hasCompletedTour && (
        <motion.div
          key="tour-complete-banner"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-[55] hidden md:block"
        >
          <div className="text-xs px-3 py-2 rounded-full border border-brand-border bg-brand-card/90 text-brand-muted shadow-lg">
            Tour completed. Use Replay Tour in the sidebar anytime.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
