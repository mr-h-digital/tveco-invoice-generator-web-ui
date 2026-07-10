import { useEffect, useState } from 'react';
import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { SplashScreen } from './components/SplashScreen';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { NewInvoicePage } from './pages/NewInvoicePage';
import { EditInvoicePage } from './pages/EditInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { QuotesPage } from './pages/QuotesPage';
import { NewQuotePage } from './pages/NewQuotePage';
import { EditQuotePage } from './pages/EditQuotePage';
import { QuoteDetailPage } from './pages/QuoteDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ExportJobsPage } from './pages/ExportJobsPage';
import { ExportInquiriesPage } from './pages/ExportInquiriesPage';
import { PublicTrackingPage } from './pages/PublicTrackingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { useAuthStore } from './store/authStore';
import { useOnboardingStore } from './store/onboardingStore';
import { useNotificationStore } from './store/notificationStore';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex-1 flex flex-col"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function PrivateAppRoutes() {
  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="/invoices" element={<AnimatedPage><InvoicesPage /></AnimatedPage>} />
          <Route path="/invoices/new" element={<AnimatedPage><NewInvoicePage /></AnimatedPage>} />
          <Route path="/invoices/:id" element={<AnimatedPage><InvoiceDetailPage /></AnimatedPage>} />
          <Route path="/invoices/:id/edit" element={<AnimatedPage><EditInvoicePage /></AnimatedPage>} />
          <Route path="/quotes" element={<AnimatedPage><QuotesPage /></AnimatedPage>} />
          <Route path="/quotes/new" element={<AnimatedPage><NewQuotePage /></AnimatedPage>} />
          <Route path="/quotes/:id" element={<AnimatedPage><QuoteDetailPage /></AnimatedPage>} />
          <Route path="/quotes/:id/edit" element={<AnimatedPage><EditQuotePage /></AnimatedPage>} />
          <Route path="/export-inquiries" element={<AnimatedPage><ExportInquiriesPage /></AnimatedPage>} />
          <Route path="/clients" element={<AnimatedPage><ClientsPage /></AnimatedPage>} />
          <Route path="/exports" element={<AnimatedPage><ExportJobsPage /></AnimatedPage>} />
          <Route path="/notifications" element={<AnimatedPage><NotificationsPage /></AnimatedPage>} />
          <Route path="/analytics" element={<AnimatedPage><AnalyticsPage /></AnimatedPage>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}

function PrivateClientRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/client-zone" replace />} />
        <Route path="/client-zone" element={<AnimatedPage><ClientPortalPage /></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/client-zone" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const user = useAuthStore((s) => s.user);
  const initializeOnboarding = useOnboardingStore((s) => s.initialize);
  const dispatchOutbox = useNotificationStore((s) => s.dispatchOutbox);
  const dispatchingOutbox = useNotificationStore((s) => s.dispatchingOutbox);
  const refreshOutboxStats = useNotificationStore((s) => s.refreshOutboxStats);

  useEffect(() => {
    initializeOnboarding(user?.email ?? null);
  }, [initializeOnboarding, user?.email]);

  useEffect(() => {
    if (!user) return;
    refreshOutboxStats();

    const intervalMs = 120000;
    const run = async () => {
      if (dispatchingOutbox) return;
      await dispatchOutbox();
    };

    const timer = window.setInterval(run, intervalMs);
    return () => window.clearInterval(timer);
  }, [user, dispatchOutbox, dispatchingOutbox, refreshOutboxStats]);

  return (
    <>
      {/* Splash — shown once on every load */}
      <SplashScreen onComplete={() => setSplashDone(true)} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: splashDone ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ visibility: splashDone ? 'visible' : 'hidden' }}
      >
        <BrowserRouter>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/track/:token" element={<PublicTrackingPage />} />
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to={user.role === 'client' ? '/client-zone' : '/dashboard'} replace />
                  ) : (
                    <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <LoginPage />
                    </motion.div>
                  )
                }
              />
              <Route
                path="/signup"
                element={
                  user ? (
                    <Navigate to={user.role === 'client' ? '/client-zone' : '/dashboard'} replace />
                  ) : (
                    <motion.div key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <SignupPage />
                    </motion.div>
                  )
                }
              />
              <Route
                path="/admin/login"
                element={
                  user ? (
                    <Navigate to={user.role === 'client' ? '/client-zone' : '/dashboard'} replace />
                  ) : (
                    <motion.div key="admin-login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      <AdminLoginPage />
                    </motion.div>
                  )
                }
              />
              <Route
                path="/*"
                element={
                  user ? (
                    <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                      {user.role === 'client' ? <PrivateClientRoutes /> : <PrivateAppRoutes />}
                    </motion.div>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </AnimatePresence>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#181C23',
                border: '1px solid #252B35',
                color: '#C8D4E0',
              },
            }}
          />
        </BrowserRouter>
      </motion.div>
    </>
  );
}
