interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-xl bg-brand-card border border-brand-border flex items-center justify-center text-brand-muted mb-4">
          {icon}
        </div>
      )}
      <p className="font-head font-semibold text-brand-white mb-1">{title}</p>
      {description && <p className="text-brand-muted text-sm max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
