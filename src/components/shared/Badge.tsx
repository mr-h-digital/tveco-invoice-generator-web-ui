import type { InvoiceStatus } from '../../types/invoice';

const CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT:   { label: 'Draft',   className: 'bg-brand-border/50 text-brand-muted' },
  SENT:    { label: 'Sent',    className: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  PAID:    { label: 'Paid',    className: 'bg-orange/15 text-orange border border-orange/30' },
  OVERDUE: { label: 'Overdue', className: 'bg-red-500/15 text-red-400 border border-red-500/30' },
};

export function Badge({ status }: { status: InvoiceStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-head tracking-wide ${className}`}>
      {label}
    </span>
  );
}
