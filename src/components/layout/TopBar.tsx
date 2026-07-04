interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border sticky top-0 z-20 bg-brand-dark/95 backdrop-blur-sm print:hidden">
      <div className="min-w-0 flex-1 mr-3">
        <h1 className="font-display text-xl sm:text-2xl text-brand-white tracking-wide truncate">{title}</h1>
        {subtitle && <p className="text-brand-muted text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
