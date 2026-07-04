interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-brand-border sticky top-0 z-20 bg-brand-dark/90 backdrop-blur-sm print:hidden">
      <div>
        <h1 className="font-display text-2xl text-brand-white tracking-wide">{title}</h1>
        {subtitle && <p className="text-brand-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
