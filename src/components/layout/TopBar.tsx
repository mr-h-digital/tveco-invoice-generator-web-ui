interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const useApi = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  let apiHost = 'configured API';

  if (useApi) {
    try {
      apiHost = new URL(apiBaseUrl).host;
    } catch {
      apiHost = apiBaseUrl;
    }
  }

  return (
    <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border sticky top-0 z-20 bg-brand-dark/95 backdrop-blur-sm print:hidden">
      <div className="min-w-0 flex-1 mr-3">
        <h1 className="font-display text-xl sm:text-2xl text-brand-white tracking-wide truncate">{title}</h1>
        {subtitle && <p className="text-brand-muted text-xs sm:text-sm mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end w-full lg:w-auto">
        <div
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-head border"
          style={
            useApi
              ? { color: '#22C55E', borderColor: 'rgba(34,197,94,0.38)', background: 'rgba(34,197,94,0.10)' }
              : { color: '#F59E0B', borderColor: 'rgba(245,158,11,0.38)', background: 'rgba(245,158,11,0.10)' }
          }
          title={useApi ? `Connected to ${apiBaseUrl}` : 'Using browser localStorage data'}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: useApi ? '#22C55E' : '#F59E0B' }} />
          <span>{useApi ? `LIVE API · ${apiHost}` : 'LOCAL STORAGE'}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}
