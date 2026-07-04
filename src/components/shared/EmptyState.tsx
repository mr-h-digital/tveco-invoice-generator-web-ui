interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-brand-muted"
          style={{ background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)' }}
        >
          {icon}
        </div>
      )}
      <p className="font-head font-bold text-brand-white text-base mb-2">{title}</p>
      {description && (
        <p className="text-brand-muted text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
