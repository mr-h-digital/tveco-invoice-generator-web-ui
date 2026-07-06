import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Quote } from '../../types/quote';
import tvecoLogo from '../../assets/tveco-logo.png';

interface QuotePreviewProps {
  quote: Partial<Quote> & {
    quoteNumber?: string;
    clientSnapshot?: Quote['clientSnapshot'];
    lineItems?: Quote['lineItems'];
  };
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#8A99AE',
  SENT: '#60A5FA',
  ACCEPTED: '#10B981',
  REJECTED: '#EF4444',
  EXPIRED: '#64748B',
};

export function QuotePreview({ quote }: QuotePreviewProps) {
  const items = quote.lineItems ?? [];
  const subtotal = quote.subtotal ?? items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const statusColor = quote.status ? STATUS_COLOR[quote.status] : '#8A99AE';
  const statusLabel = quote.status ? STATUS_LABEL[quote.status] : 'DRAFT';

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-border bg-brand-night">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={tvecoLogo} alt="TVECO" className="h-12 w-auto object-contain" />
            <div>
              <p className="text-xs text-brand-muted uppercase tracking-wider">Quote</p>
              <p className="font-head text-brand-white text-lg">{quote.quoteNumber || 'QUO-XXXX-XXX'}</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border" style={{ color: statusColor, borderColor: `${statusColor}66`, background: `${statusColor}1A` }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-brand-border">
        <div>
          <p className="text-xs text-brand-muted uppercase tracking-wider mb-2">Prepared For</p>
          <p className="font-head text-brand-white text-base">{quote.clientSnapshot?.companyName || '-'}</p>
          <p className="text-sm text-brand-muted">{quote.clientSnapshot?.contactName || ''}</p>
          <p className="text-sm text-brand-muted">{quote.clientSnapshot?.email || ''}</p>
          <p className="text-sm text-brand-muted">{quote.clientSnapshot?.phone || ''}</p>
          <p className="text-sm text-brand-muted">{quote.clientSnapshot?.address || ''}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-brand-muted">Issue Date</p>
            <p className="text-brand-white font-head">{quote.issueDate ? formatDate(quote.issueDate) : '-'}</p>
          </div>
          <div>
            <p className="text-brand-muted">Expiry Date</p>
            <p className="text-brand-white font-head">{quote.expiryDate ? formatDate(quote.expiryDate) : '-'}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-12 text-xs uppercase tracking-wider text-brand-muted border-b border-brand-border pb-2">
          <div className="col-span-6">Description</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>

        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-12 py-3 border-b border-brand-border/60 text-sm">
            <div className="col-span-6 text-brand-white">
              <p>{item.name}</p>
              {item.description && <p className="text-brand-muted text-xs mt-1">{item.description}</p>}
            </div>
            <div className="col-span-2 text-right text-brand-text">{item.quantity}</div>
            <div className="col-span-2 text-right text-brand-text">{formatCurrency(item.unitPrice)}</div>
            <div className="col-span-2 text-right text-brand-white font-head">{formatCurrency(item.amount)}</div>
          </div>
        ))}

        <div className="mt-4 ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-brand-muted"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {(quote.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-red-400"><span>Discount</span><span>- {formatCurrency(quote.discountAmount ?? 0)}</span></div>
          )}
          {quote.vatEnabled && (
            <div className="flex justify-between text-brand-muted"><span>VAT</span><span>{formatCurrency(quote.vatAmount ?? 0)}</span></div>
          )}
          <div className="flex justify-between text-white font-head text-base pt-2 border-t border-brand-border">
            <span>Total</span>
            <span>{formatCurrency(quote.total ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 text-sm text-brand-muted">
        {quote.notes || 'This quote is valid until the expiry date shown above.'}
      </div>
    </div>
  );
}
