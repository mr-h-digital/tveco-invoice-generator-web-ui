import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Quote } from '../../types/quote';
import tvecoLogo from '../../assets/tveco-logo.png';

interface Props {
  quote: Quote;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: '#374151',
  SENT: '#1D4ED8',
  ACCEPTED: '#C2410C',
  REJECTED: '#B91C1C',
  EXPIRED: '#6B7280',
};
const STATUS_BG: Record<string, string> = {
  DRAFT: '#F1F5F9',
  SENT: '#DBEAFE',
  ACCEPTED: '#FFF7ED',
  REJECTED: '#FEE2E2',
  EXPIRED: '#F3F4F6',
};

const dark = '#111318';
const orange = '#FF6B00';
const ink = '#111827';
const sub = '#374151';
const muted = '#6B7280';
const rule = '#E5E7EB';
const bgGray = '#F9FAFB';
const white = '#FFFFFF';

const display = "'Bebas Neue', sans-serif";
const head = "'Space Grotesk', sans-serif";
const body = "'Outfit', sans-serif";

const label = (text: string) => (
  <div
    style={{
      fontFamily: head,
      fontSize: 8,
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
      color: muted,
      marginBottom: 6,
    }}
  >
    {text}
  </div>
);

export function QuotePrintLayout({ quote }: Props) {
  const items = quote.lineItems ?? [];
  const subtotal = quote.subtotal ?? items.reduce((sum, item) => sum + item.amount, 0);
  const statusLabel = STATUS_LABEL[quote.status] ?? quote.status;
  const statusColor = STATUS_COLOR[quote.status] ?? muted;
  const statusBg = STATUS_BG[quote.status] ?? bgGray;

  return (
    <div id="quote-print-area" style={{ fontFamily: body, color: ink, background: white, width: '100%', zoom: 0.88 }}>
      <div style={{ background: dark, borderBottom: `4px solid ${orange}`, padding: '22px 36px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={tvecoLogo}
            alt="TVECO"
            style={{
              height: 68,
              width: 'auto',
              display: 'block',
              flexShrink: 0,
              mixBlendMode: 'lighten' as const,
            }}
          />
          <div>
            <div style={{ fontFamily: display, fontWeight: 400, fontSize: 30, color: '#F0F4F8', letterSpacing: 2, lineHeight: 1 }}>TVECO</div>
            <div style={{ fontFamily: head, fontSize: 8, color: orange, letterSpacing: '0.15em', marginTop: 5, textTransform: 'uppercase' as const }}>
              Timeline Vehicle Export Company (Pty) Ltd
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: head, fontSize: 9, letterSpacing: '0.15em', color: orange, marginBottom: 4, textTransform: 'uppercase' as const }}>
            QUOTATION
          </div>
          <div style={{ fontFamily: display, fontWeight: 400, fontSize: 26, color: '#F0F4F8', letterSpacing: 0.5, lineHeight: 1 }}>
            {quote.quoteNumber}
          </div>
          <div style={{ display: 'inline-block', marginTop: 8, background: statusBg, color: statusColor, fontFamily: head, fontSize: 9, letterSpacing: '0.12em', padding: '3px 10px', borderRadius: 3, border: `1px solid ${statusColor}44`, textTransform: 'uppercase' as const }}>
            {statusLabel}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${rule}` }}>
        <div style={{ padding: '20px 36px', borderRight: `1px solid ${rule}` }}>
          {label('Prepared By')}
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 13, color: ink, marginBottom: 6 }}>
            Timeline Vehicle Export Company (Pty) Ltd
          </div>
          <div style={{ fontSize: 12, color: sub, lineHeight: 1.8 }}>
            Thabo Seabi
            <br />
            7 Blinkblaar St, Zwartkop, Centurion, 0157
            <br />
            Gauteng, South Africa
            <br />
            <span style={{ color: '#C2410C' }}>enquiries@tveco.co.za</span>
            <br />
            <span style={{ color: '#C2410C' }}>tveco.co.za</span>
            <br />
            +27 75 966 3986
          </div>
        </div>
        <div style={{ padding: '20px 36px' }}>
          {label('Prepared For')}
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 13, color: ink, marginBottom: 6, lineHeight: 1.3 }}>
            {quote.clientSnapshot.companyName}
          </div>
          <div style={{ fontSize: 12, color: sub, lineHeight: 1.8 }}>
            {quote.clientSnapshot.contactName && (
              <>
                {quote.clientSnapshot.contactName}
                <br />
              </>
            )}
            {quote.clientSnapshot.address && (
              <>
                {quote.clientSnapshot.address}
                <br />
              </>
            )}
            {quote.clientSnapshot.email && (
              <>
                <span style={{ color: '#C2410C' }}>{quote.clientSnapshot.email}</span>
                <br />
              </>
            )}
            {quote.clientSnapshot.phone && quote.clientSnapshot.phone}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: bgGray, borderBottom: `1px solid ${rule}` }}>
        {[
          { l: 'Issue Date', v: formatDate(quote.issueDate) },
          { l: 'Expiry Date', v: formatDate(quote.expiryDate) },
          { l: 'Validity', v: 'Valid until expiry date' },
        ].map(({ l, v }, i) => (
          <div key={l} style={{ padding: '13px 36px', borderRight: i < 2 ? `1px solid ${rule}` : 'none' }}>
            {label(l)}
            <div style={{ fontFamily: head, fontWeight: 600, fontSize: 12, color: ink }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 36px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 100px 100px', gap: 8, padding: '13px 0 8px', borderBottom: `2px solid ${ink}` }}>
          {['Description', 'Qty', 'Unit Price', 'Amount'].map((h, i) => (
            <div key={h} style={{ fontFamily: head, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: ink, fontWeight: 700, textAlign: i === 0 ? 'left' : 'right' }}>
              {h}
            </div>
          ))}
        </div>

        {items.map((item, idx) => (
          <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 100px 100px', gap: 8, padding: '9px 0', borderBottom: `1px solid ${rule}`, background: idx % 2 !== 0 ? bgGray : white, margin: idx % 2 !== 0 ? '0 -36px' : 0, paddingLeft: idx % 2 !== 0 ? 36 : 0, paddingRight: idx % 2 !== 0 ? 36 : 0 }}>
            <div>
              <div style={{ fontFamily: body, fontSize: 12, fontWeight: 500, color: ink }}>{item.name}</div>
              {item.description && <div style={{ fontFamily: body, fontSize: 10, color: muted, fontStyle: 'italic', marginTop: 2 }}>{item.description}</div>}
            </div>
            <div style={{ fontFamily: head, fontSize: 11, color: muted, textAlign: 'center', paddingTop: 2 }}>{item.quantity}</div>
            <div style={{ fontFamily: head, fontSize: 11, color: sub, textAlign: 'right', paddingTop: 2 }}>{formatCurrency(item.unitPrice)}</div>
            <div style={{ fontFamily: head, fontSize: 11, color: ink, fontWeight: 700, textAlign: 'right', paddingTop: 2 }}>{formatCurrency(item.amount)}</div>
          </div>
        ))}
      </div>

      <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <div style={{ padding: '16px 36px 18px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${rule}` }}>
              <span style={{ fontSize: 12, color: muted }}>Subtotal</span>
              <span style={{ fontFamily: head, fontSize: 12, color: ink }}>{formatCurrency(subtotal)}</span>
            </div>
            {(quote.discountAmount ?? 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${rule}` }}>
                <span style={{ fontSize: 12, color: muted }}>
                  Discount{quote.discountType === 'PERCENT' ? ` (${quote.discountValue}%)` : ''}
                </span>
                <span style={{ fontFamily: head, fontSize: 12, color: '#B91C1C' }}>- {formatCurrency(quote.discountAmount)}</span>
              </div>
            )}
            {quote.vatEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${rule}` }}>
                <span style={{ fontSize: 12, color: muted }}>VAT ({((quote.vatRate ?? 0.15) * 100).toFixed(0)}%)</span>
                <span style={{ fontFamily: head, fontSize: 12, color: ink }}>{formatCurrency(quote.vatAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', marginTop: 10, background: dark, borderRadius: 5, borderLeft: `4px solid ${orange}` }}>
              <span style={{ fontFamily: head, fontWeight: 700, fontSize: 13, color: orange, letterSpacing: 0.3 }}>TOTAL QUOTE</span>
              <span style={{ fontFamily: head, fontWeight: 700, fontSize: 19, color: '#F0F4F8' }}>{formatCurrency(quote.total)}</span>
            </div>
          </div>
        </div>

        <div style={{ margin: '0 36px 18px', border: `1px solid ${rule}`, borderRadius: 5, display: 'grid', gridTemplateColumns: '1fr 1fr', background: bgGray }}>
          <div style={{ padding: '15px 20px', borderRight: `1px solid ${rule}` }}>
            {label('Quote Terms')}
            <p style={{ fontSize: 11, color: sub, lineHeight: 1.7, margin: '0 0 8px' }}>
              {quote.notes || 'This quote is valid until the expiry date shown above. Pricing is subject to stock availability and may change after expiry.'}
            </p>
          </div>
          <div style={{ padding: '15px 20px' }}>
            {label('Acceptance')}
            <p style={{ fontSize: 11, color: sub, lineHeight: 1.7, margin: '0 0 8px' }}>
              To proceed, kindly confirm acceptance of this quotation before the expiry date.
            </p>
            <p style={{ fontSize: 11, color: muted, margin: 0 }}>
              Acceptance queries to <span style={{ color: '#C2410C' }}>enquiries@tveco.co.za</span>
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${rule}`, padding: '10px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={tvecoLogo} alt="TVECO" style={{ height: 28, width: 'auto', opacity: 0.75 }} />
            <span style={{ fontFamily: head, fontSize: 9, color: muted }}>
              Timeline Vehicle Export Co.  ·  <span style={{ color: '#C2410C' }}>tveco.co.za</span>
            </span>
          </div>
          <span style={{ fontFamily: body, fontSize: 10, color: muted, fontStyle: 'italic' }}>
            Centurion, Gauteng, South Africa
          </span>
        </div>
      </div>
    </div>
  );
}
