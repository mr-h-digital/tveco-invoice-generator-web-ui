import { Mail, Phone, MapPin, FileText, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Client } from '../../types/client';
import type { Invoice } from '../../types/invoice';
import type { Quote } from '../../types/quote';

interface ClientCardProps {
  client: Client;
  invoices: Invoice[];
  quotes: Quote[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientCard({ client, invoices, quotes, onEdit, onDelete }: ClientCardProps) {
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const clientQuotes = quotes.filter((q) => q.clientId === client.id);
  const total = clientInvoices.reduce((sum, i) => sum + i.total, 0);
  const quoteStatus = clientQuotes.reduce(
    (acc, quote) => {
      if (quote.status === 'SENT') acc.sent += 1;
      if (quote.status === 'ACCEPTED') acc.accepted += 1;
      if (quote.status === 'DRAFT') acc.draft += 1;
      return acc;
    },
    { sent: 0, accepted: 0, draft: 0 }
  );

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 hover:border-brand-muted transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-head font-bold text-brand-white truncate">{client.companyName}</h3>
          {client.contactName && <p className="text-brand-muted text-sm truncate">{client.contactName}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(client)} className="p-2.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card2 transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(client)} className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-brand-card2 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {client.email && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Mail size={12} className="shrink-0" />
            <a href={`mailto:${client.email}`} className="truncate hover:text-[#FF6B00] transition-colors">{client.email}</a>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Phone size={12} className="shrink-0" />
            <a href={`tel:${client.phone}`} className="hover:text-[#FF6B00] transition-colors">{client.phone}</a>
          </div>
        )}
        {client.address && (
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <MapPin size={12} className="shrink-0" /><span className="truncate">{client.address}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-brand-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <FileText size={12} />
            <span>{clientInvoices.length} invoice{clientInvoices.length !== 1 ? 's' : ''}</span>
          </div>
          {total > 0 && (
            <span className="font-head text-xs font-bold" style={{ color: '#FF6B00' }}>{formatCurrency(total)}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <FileText size={12} />
            <span>{clientQuotes.length} quote{clientQuotes.length !== 1 ? 's' : ''}</span>
          </div>
          {(quoteStatus.sent > 0 || quoteStatus.accepted > 0 || quoteStatus.draft > 0) && (
            <span className="text-[11px] text-brand-muted">
              {quoteStatus.sent > 0 ? `${quoteStatus.sent} sent` : ''}
              {quoteStatus.sent > 0 && quoteStatus.accepted > 0 ? ' · ' : ''}
              {quoteStatus.accepted > 0 ? `${quoteStatus.accepted} accepted` : ''}
              {(quoteStatus.sent > 0 || quoteStatus.accepted > 0) && quoteStatus.draft > 0 ? ' · ' : ''}
              {quoteStatus.draft > 0 ? `${quoteStatus.draft} draft` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
