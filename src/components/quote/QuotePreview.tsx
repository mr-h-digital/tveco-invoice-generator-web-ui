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

const C = {
  night: '#0A0C0F',
  dark: '#111318',
  border: '#252B35',
  muted: '#8A99AE',
  text: '#C8D4E0',
  white: '#F0F4F8',
  orange: '#FF6B00',
  red: '#EF4444',
};

const display = "'Bebas Neue', sans-serif";
const head = "'Space Grotesk', sans-serif";
const body = "'Outfit', sans-serif";

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontFamily: head, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' as const, color: C.orange, margin: '0 0 10px' }}>
      {children}
    </p>
  );
}

function TotalsRow({ label, value, color = C.text }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid rgba(37,43,53,0.6)` }}>
      <span style={{ fontFamily: body, fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontFamily: head, fontSize: 12, color }}>{value}</span>
    </div>
  );
}

export function QuotePreview({ quote }: QuotePreviewProps) {
  const items = quote.lineItems ?? [];
  const subtotal = quote.subtotal ?? items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const statusColor = quote.status ? STATUS_COLOR[quote.status] : C.muted;
  const statusLabel = quote.status ? STATUS_LABEL[quote.status] : 'DRAFT';
  const padH = 'clamp(16px, 4vw, 48px)';

  return (
    <div
      className="quote-preview"
      style={{ background: C.dark, color: C.text, fontFamily: body, borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 60px rgba(0,0,0,0.5), 0 0 0 1px #252B35' }}
    >
      <div style={{ background: C.night, padding: `clamp(20px,4vw,40px) ${padH} clamp(16px,3vw,28px)`, borderBottom: `3px solid ${C.orange}`, position: 'relative', overflow: 'hidden' }}>
        <div className="inv-watermark" style={{ position: 'absolute', right: -8, top: -12, fontFamily: display, fontSize: 'clamp(60px,14vw,130px)', fontWeight: 400, color: 'rgba(255,107,0,0.05)', lineHeight: 1, letterSpacing: 2, pointerEvents: 'none', userSelect: 'none' }}>
          TVECO
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={tvecoLogo}
              alt="TVECO"
              style={{
                height: 'clamp(52px, 9vw, 80px)',
                width: 'auto',
                display: 'block',
                filter: 'drop-shadow(0 0 12px rgba(255,107,0,0.35))',
                flexShrink: 0,
              }}
            />
            <div>
              <p style={{ fontFamily: head, fontSize: 11, color: C.orange, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>Timeline Vehicle Export Co.</p>
              <p style={{ fontFamily: body, fontSize: 11, color: C.muted, margin: '3px 0 0', lineHeight: 1.5 }}>
                enquiries@tveco.co.za · tveco.co.za
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <p style={{ fontFamily: head, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: C.orange, margin: '0 0 4px' }}>Quotation</p>
            <p style={{ fontFamily: display, fontSize: 'clamp(18px,4vw,28px)', color: C.white, lineHeight: 1, letterSpacing: 0.5, margin: '0 0 10px', wordBreak: 'break-all' }}>
              {quote.quoteNumber || 'QUO-XXXX-XXX'}
            </p>
            <span style={{ display: 'inline-block', background: `${statusColor}22`, border: `1px solid ${statusColor}44`, color: statusColor, fontFamily: head, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4 }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ padding: `clamp(16px,3vw,28px) ${padH}`, borderRight: `1px solid ${C.border}` }}>
          <SectionLabel>Prepared By</SectionLabel>
          <p style={{ fontFamily: head, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, color: C.white, margin: '0 0 6px', lineHeight: 1.3 }}>Timeline Vehicle Export Company (Pty) Ltd</p>
          <div style={{ fontFamily: body, fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
            Thabo Seabi<br />
            7 Blinkblaar St, Zwartkop<br />
            Centurion, 0157, South Africa<br />
            <span style={{ color: C.orange }}>enquiries@tveco.co.za</span><br />
            <span style={{ color: C.orange }}>tveco.co.za</span><br />
            +27 75 966 3986
          </div>
        </div>
        <div style={{ padding: `clamp(16px,3vw,28px) ${padH}` }}>
          <SectionLabel>Prepared For</SectionLabel>
          <p style={{ fontFamily: head, fontSize: 'clamp(13px,2vw,15px)', fontWeight: 700, color: C.white, margin: '0 0 6px', lineHeight: 1.3 }}>
            {quote.clientSnapshot?.companyName || '—'}
          </p>
          <div style={{ fontFamily: body, fontSize: 12, color: C.muted, lineHeight: 1.8, wordBreak: 'break-word' }}>
            {quote.clientSnapshot?.contactName && (
              <>
                {quote.clientSnapshot.contactName}
                <br />
              </>
            )}
            {quote.clientSnapshot?.address && (
              <>
                {quote.clientSnapshot.address}
                <br />
              </>
            )}
            {quote.clientSnapshot?.email && (
              <>
                <span style={{ color: C.orange }}>{quote.clientSnapshot.email}</span>
                <br />
              </>
            )}
            {quote.clientSnapshot?.phone && <>{quote.clientSnapshot.phone}</>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', background: 'rgba(0,0,0,0.18)', borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: 'Issue Date', value: quote.issueDate ? formatDate(quote.issueDate) : '—' },
          { label: 'Expiry Date', value: quote.expiryDate ? formatDate(quote.expiryDate) : '—' },
          { label: 'Validity', value: 'Valid until expiry date' },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ padding: `clamp(12px,2vw,16px) ${padH}`, borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <p style={{ fontFamily: head, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: C.muted, margin: '0 0 4px' }}>{label}</p>
            <p style={{ fontFamily: head, fontSize: 'clamp(11px,2vw,13px)', fontWeight: 600, color: C.white, margin: 0, wordBreak: 'break-all' }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: `0 ${padH}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: 8, padding: 'clamp(12px,2vw,16px) 0 8px', borderBottom: `1px solid ${C.border}` }}>
          {['Description', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
            <span key={h} style={{ fontFamily: head, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, textAlign: i === 0 ? 'left' : 'right' }}>
              {h}
            </span>
          ))}
        </div>

        {items.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.muted, fontStyle: 'italic', padding: '20px 0', margin: 0 }}>No line items yet</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 50px 90px 90px',
                gap: 8,
                padding: 'clamp(10px,1.5vw,13px) 0',
                borderBottom: `1px solid rgba(37,43,53,0.5)`,
                background: idx % 2 !== 0 ? 'rgba(255,255,255,0.018)' : 'transparent',
                alignItems: 'start',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: body, fontSize: 'clamp(11px,1.8vw,13px)', fontWeight: 500, color: C.white, margin: '0 0 2px', wordBreak: 'break-word' }}>{item.name}</p>
                {item.description && (
                  <p style={{ fontFamily: body, fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.4, margin: 0, wordBreak: 'break-word' }}>{item.description}</p>
                )}
              </div>
              <span style={{ fontFamily: head, fontSize: 11, color: C.muted, textAlign: 'center', paddingTop: 2 }}>{item.quantity}</span>
              <span style={{ fontFamily: head, fontSize: 11, color: C.text, textAlign: 'right', paddingTop: 2, wordBreak: 'break-all' }}>{formatCurrency(item.unitPrice)}</span>
              <span style={{ fontFamily: head, fontSize: 11, color: C.white, fontWeight: 600, textAlign: 'right', paddingTop: 2, wordBreak: 'break-all' }}>{formatCurrency(item.amount)}</span>
            </div>
          ))
        )}

        <div style={{ padding: `4px 0 clamp(20px,3vw,28px)`, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', maxWidth: 280 }}>
            <TotalsRow label="Subtotal" value={formatCurrency(subtotal)} />
          {(quote.discountAmount ?? 0) > 0 && (
              <TotalsRow
                label={`Discount${quote.discountType === 'PERCENT' ? ` (${quote.discountValue}%)` : ''}`}
                value={`− ${formatCurrency(quote.discountAmount ?? 0)}`}
                color={C.red}
              />
          )}
          {quote.vatEnabled && (
              <TotalsRow
                label={`VAT (${((quote.vatRate ?? 0.15) * 100).toFixed(0)}%)`}
                value={formatCurrency(quote.vatAmount ?? 0)}
              />
          )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(12px,2vw,16px) clamp(12px,2vw,20px)', background: C.orange, borderRadius: 8, marginTop: 12 }}>
              <span style={{ fontFamily: head, fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>TOTAL QUOTE</span>
              <span style={{ fontFamily: head, fontSize: 'clamp(14px,2.5vw,20px)', fontWeight: 700, color: '#fff' }}>{formatCurrency(quote.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ margin: `0 ${padH} clamp(16px,2.5vw,24px)`, padding: 'clamp(16px,2.5vw,22px) clamp(14px,2.5vw,24px)', background: 'rgba(0,0,0,0.22)', border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <SectionLabel>Quote Terms</SectionLabel>
        <p style={{ fontFamily: body, fontSize: 12, color: C.muted, lineHeight: 1.7, margin: 0 }}>
          {quote.notes || 'This quote is valid until the expiry date shown above.'}
        </p>
      </div>

      <div style={{ marginTop: 4, padding: `clamp(12px,2vw,18px) ${padH}`, borderTop: `1px solid ${C.border}`, background: 'rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: head, fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
          <span style={{ color: C.orange, fontWeight: 700 }}>TVECO</span> · Timeline Vehicle Export Company (Pty) Ltd · <span style={{ color: C.orange }}>tveco.co.za</span>
        </div>
        <p style={{ fontFamily: body, fontSize: 11, fontStyle: 'italic', color: C.muted, margin: 0 }}>
          Centurion, Gauteng, South Africa
        </p>
      </div>
    </div>
  );
}
