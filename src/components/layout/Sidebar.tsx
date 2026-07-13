import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ClipboardList, Users, BarChart2, LogOut, RotateCcw, Lightbulb, Ship, Bell, UserCog } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import tvecoLogo from '../../assets/tveco-logo.png';
import mrhLogo from '../../assets/mrh-digital-logo.png';
import navBg from '../../assets/tveco-nav-bg.jpg';

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/clients',        label: 'Clients',        icon: Users },
  { to: '/quotes',         label: 'Quotes',         icon: ClipboardList },
  { to: '/export-inquiries', label: 'Export Inquiries', icon: ClipboardList },
  { to: '/exports',        label: 'Exports',        icon: Ship },
  { to: '/invoices',       label: 'Invoices',       icon: FileText },
  { to: '/notifications',  label: 'Notifications',  icon: Bell },
  { to: '/profile',        label: 'Profile',        icon: UserCog },
  { to: '/analytics',      label: 'Analytics',      icon: BarChart2 },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const tutorialMode = useOnboardingStore((s) => s.tutorialMode);
  const hasCompletedTour = useOnboardingStore((s) => s.hasCompletedTour);
  const lastTourStepIndex = useOnboardingStore((s) => s.lastTourStepIndex);
  const replayTour = useOnboardingStore((s) => s.replayTour);
  const resumeTour = useOnboardingStore((s) => s.resumeTour);
  const setTutorialMode = useOnboardingStore((s) => s.setTutorialMode);
  const canResumeTour = !hasCompletedTour && lastTourStepIndex > 0;

  async function handleLogout() {
    await logout();
    toast.success('Signed out');
  }

  function handleReplayTour() {
    if (canResumeTour) {
      resumeTour();
      toast.success(`Resumed tour at step ${lastTourStepIndex + 1}`);
    } else {
      replayTour();
      toast.success('Tour started');
    }
    onNavClick?.();
  }

  function handleToggleTutorialMode() {
    setTutorialMode(!tutorialMode);
    toast.success(tutorialMode ? 'Tutorial tips turned off' : 'Tutorial tips turned on');
  }

  return (
    <aside
      className="relative w-[min(16rem,85vw)] lg:w-64 shrink-0 h-dvh sticky top-0 flex flex-col border-r border-brand-border print:hidden overflow-hidden"
      style={{ backgroundImage: `url(${navBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-brand-night/88 pointer-events-none" />
      {/* Logo */}
      <div className="relative px-5 py-4 border-b border-brand-border/60">
        <div className="flex items-center gap-3">
          <img src={tvecoLogo} alt="TVECO" className="w-11 h-11 object-contain shrink-0"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.3))' }} />
          <div>
            <p className="font-display text-xl text-brand-white leading-none tracking-wider">TVECO</p>
            <p className="text-brand-muted text-xs leading-tight mt-0.5">Operations Hub</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors',
                isActive
                  ? 'text-brand-dark font-medium'
                  : 'text-brand-text hover:bg-white/5 hover:text-brand-white'
              )
            }
            style={({ isActive }) => isActive ? { background: '#FF6B00', color: '#fff' } : {}}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="relative px-3 pt-2 pb-3 border-t border-brand-border/60 space-y-3">
        <div className="space-y-1.5">
          <button
            onClick={handleReplayTour}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-brand-text hover:bg-white/5 transition-colors"
          >
            <RotateCcw size={14} />
            {canResumeTour ? `Resume Tour (Step ${lastTourStepIndex + 1})` : 'Replay Tour'}
          </button>
          <button
            onClick={handleToggleTutorialMode}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-brand-text hover:bg-white/5 transition-colors"
          >
            <Lightbulb size={14} />
            Tutorial Tips: {tutorialMode ? 'On' : 'Off'}
          </button>
        </div>

        {/* User + logout */}
          <div className="px-3 py-2.5 rounded-lg hover:bg-white/5 group transition-colors space-y-2">
            <div className="min-w-0">
            <p className="text-brand-text text-xs font-medium truncate">{user?.email ?? 'admin@tveco.co.za'}</p>
            <p className="text-brand-muted text-xs opacity-70 capitalize">{user?.role ?? 'admin'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-brand-muted border border-brand-border/60 hover:text-red-400 hover:border-red-400/50 transition-colors"
          >
            <LogOut size={15} />
              <span>Sign out</span>
          </button>
        </div>

        {/* MRH Digital credit */}
        <div className="px-3 pb-1 flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity">
          <span className="text-brand-muted text-[10px] shrink-0">Built by</span>
          <img src={mrhLogo} alt="Mr. H Digital" className="h-5 w-auto object-contain" />
        </div>
      </div>
    </aside>
  );
}
