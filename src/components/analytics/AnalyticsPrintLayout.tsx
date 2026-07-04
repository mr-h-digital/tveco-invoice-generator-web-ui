/**
 * AnalyticsPrintLayout — renders only when printing.
 *
 * Key constraint: ResponsiveContainer uses ResizeObserver which returns 0
 * during print (no layout pass). Every chart uses explicit pixel dimensions
 * so SVGs render correctly on A4 portrait (198mm usable ≈ 748px at 96 dpi).
 */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type {
  MonthRevenue, StatusSlice, ClientRevenue, ServiceRevenue,
} from '../../utils/analyticsData';
import tvecoLogo from '../../assets/tveco-logo.png';

interface Props {
  monthly: MonthRevenue[];
  statusBreakdown: StatusSlice[];
  topClients: ClientRevenue[];
  topServices: ServiceRevenue[];
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
  avgValue: number;
  invoiceCount: number;
  clientCount: number;
  generatedDate: string;
  periodLabel?: string;
  periodFrom?: string;
  periodTo?: string;
}

/* ── Design tokens ── */
const orange  = '#FF6B00';
const dark    = '#111318';
const ink     = '#111827';
const sub     = '#374151';
const muted   = '#6B7280';
const rule    = '#E5E7EB';
const bgGray  = '#F9FAFB';
const white   = '#FFFFFF';
const head    = "'Space Grotesk', sans-serif";
const body    = "'Outfit', sans-serif";
const display = "'Bebas Neue', sans-serif";

const STATUS_COLORS: Record<string, string> = {
  PAID: '#22C55E', SENT: '#60A5FA', OVERDUE: '#EF4444', DRAFT: '#9CA3AF',
};

/* ── A4 print geometry (96 dpi, margins 8mm/6mm) ──
   Usable width  ≈ 748px   (210mm - 12mm)
   Usable height ≈ 1063px  (297mm - 16mm)
   Horizontal padding inside sections: 32px left + 24px right = 56px
   ─────────────────────────────────────────────────────────────────── */
const PAGE_W   = 748;   // usable page width px
const H_PAD    = 56;    // section horizontal padding total

// Revenue section: 1.6fr / (1.6 + 1) = ~61.5%
const BAR_SECTION_W  = Math.floor(PAGE_W * 0.615);
const BAR_CHART_W    = BAR_SECTION_W - H_PAD;  // ≈ 404px
const BAR_CHART_H    = 155;

// Status section: 1fr / 2.6 = ~38.5%
const PIE_SECTION_W  = PAGE_W - BAR_SECTION_W;
const PIE_CHART_W    = PIE_SECTION_W - H_PAD;  // ≈ 234px
const PIE_CHART_H    = 140;


/* ── Sub-components ── */
function KpiCard({ label, value, sub: subText, color = orange }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ background: bgGray, border: `1px solid ${rule}`, borderRadius: 6, padding: '10px 12px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontFamily: head, fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: muted, marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: head, fontWeight: 700, fontSize: 14, color: ink, lineHeight: 1 }}>{value}</div>
      {subText && <div style={{ fontFamily: body, fontSize: 9, color: muted, marginTop: 3 }}>{subText}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div style={{ fontFamily: head, fontWeight: 700, fontSize: 10.5, color: ink, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function BarRow({ label, amount, pct, color, sub: subText }: {
  label: string; amount: number; pct: number; color: string; sub?: string;
}) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: body, fontSize: 8.5, color: sub, maxWidth: '62%', overflow: 'hidden', whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis' as const }}>
          {label}
        </span>
        <span style={{ fontFamily: head, fontSize: 8.5, fontWeight: 700, color: ink }}>{formatCurrency(amount)}</span>
      </div>
      <div style={{ height: 4, background: rule, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2 }} />
      </div>
      {subText && <div style={{ fontFamily: head, fontSize: 7.5, color: muted, marginTop: 2 }}>{subText}</div>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { fontFamily: head, fontSize: 8, background: white, border: `1px solid ${rule}`, borderRadius: 4, padding: '4px 8px' },
  labelStyle: { color: muted },
  itemStyle: { color: ink },
};

/* ══════════════════════════════════════════════════════════════════════════ */
export function AnalyticsPrintLayout({
  monthly, statusBreakdown, topClients, topServices,
  totalInvoiced, totalPaid, totalOutstanding, totalOverdue,
  collectionRate, avgValue, invoiceCount, clientCount, generatedDate,
  periodLabel, periodFrom, periodTo,
}: Props) {

  const paidPct        = totalInvoiced > 0 ? Math.round((totalPaid        / totalInvoiced) * 100) : 0;
  const outstandingPct = totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0;
  const overduePct     = totalInvoiced > 0 ? Math.round((totalOverdue     / totalInvoiced) * 100) : 0;

  return (
    <div
      id="analytics-print-area"
      style={{ fontFamily: body, color: ink, background: white, width: '100%', fontSize: 10 }}
    >

      {/* ══ HEADER ═══════════════════════════════════════════════════════ */}
      <div style={{
        background: dark, borderBottom: `4px solid ${orange}`,
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src={tvecoLogo} alt="TVECO"
            style={{ height: 52, width: 'auto', mixBlendMode: 'lighten' as const }}
          />
          <div>
            <div style={{ fontFamily: display, fontSize: 24, color: '#F0F4F8', letterSpacing: 2, lineHeight: 1 }}>TVECO</div>
            <div style={{ fontFamily: head, fontSize: 8, color: orange, letterSpacing: '0.15em', marginTop: 3, textTransform: 'uppercase' as const }}>
              Business Analytics Report
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {periodLabel && (
            <>
              <div style={{ fontFamily: head, fontSize: 8, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 2 }}>Period</div>
              <div style={{ fontFamily: head, fontWeight: 700, fontSize: 12, color: '#F0F4F8' }}>{periodLabel}</div>
              {periodFrom && periodTo && (
                <div style={{ fontFamily: body, fontSize: 9, color: '#8A99AE', marginTop: 1 }}>
                  {formatDate(periodFrom)} – {formatDate(periodTo)}
                </div>
              )}
              <div style={{ height: 1, background: 'rgba(255,107,0,0.25)', margin: '6px 0' }} />
            </>
          )}
          <div style={{ fontFamily: head, fontSize: 8, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Generated</div>
          <div style={{ fontFamily: head, fontWeight: 600, fontSize: 11, color: '#F0F4F8' }}>{formatDate(generatedDate)}</div>
          <div style={{ fontFamily: body, fontSize: 9, color: '#8A99AE', marginTop: 2 }}>Timeline Vehicle Export Co. (Pty) Ltd</div>
        </div>
      </div>

      {/* ══ KPI ROW ══════════════════════════════════════════════════════ */}
      <div style={{ padding: '12px 32px', background: bgGray, borderBottom: `1px solid ${rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <KpiCard label="Total Invoiced"  value={formatCurrency(totalInvoiced)}   sub={`${invoiceCount} invoices`}          color={orange}    />
          <KpiCard label="Total Collected" value={formatCurrency(totalPaid)}        sub={`${paidPct}% of total`}              color="#22C55E"   />
          <KpiCard label="Outstanding"     value={formatCurrency(totalOutstanding)} sub={`${outstandingPct}% of total`}       color="#60A5FA"   />
          <KpiCard label="Overdue"         value={formatCurrency(totalOverdue)}     sub={`${overduePct}% of total`}           color="#EF4444"   />
          <KpiCard label="Collection Rate" value={`${collectionRate}%`}             sub="paid vs billed"                      color="#22C55E"   />
          <KpiCard label="Avg. Invoice"    value={formatCurrency(avgValue)}         sub={`${clientCount} client${clientCount !== 1 ? 's' : ''}`} color={orange} />
        </div>
      </div>

      {/* ══ REVENUE BAR + STATUS DONUT ═══════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${rule}` }}>

        {/* Bar chart — fixed pixel dimensions, no ResponsiveContainer */}
        <div style={{ flex: '1.6', padding: '14px 24px 12px 32px', borderRight: `1px solid ${rule}`, minWidth: 0 }}>
          <SectionTitle>Monthly Revenue Trend</SectionTitle>
          <BarChart
            width={BAR_CHART_W}
            height={BAR_CHART_H}
            data={monthly}
            margin={{ top: 2, right: 4, left: -12, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={rule} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontFamily: head, fontSize: 7.5, fill: muted }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontFamily: head, fontSize: 7.5, fill: muted }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: number) => v >= 1000 ? `R${(v / 1000).toFixed(0)}k` : `R${v}`}
              width={36}
            />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} {...tooltipStyle} />
            <Bar dataKey="paid"        name="Paid"        fill="#22C55E" radius={[2, 2, 0, 0]} />
            <Bar dataKey="outstanding" name="Outstanding" fill="#60A5FA" radius={[2, 2, 0, 0]} />
            <Bar dataKey="overdue"     name="Overdue"     fill="#EF4444" radius={[2, 2, 0, 0]} />
          </BarChart>
          {/* Manual legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 5 }}>
            {[['#22C55E','Paid'],['#60A5FA','Outstanding'],['#EF4444','Overdue']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />
                <span style={{ fontFamily: head, fontSize: 7.5, color: muted }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart — fixed pixel dimensions */}
        <div style={{ flex: '1', padding: '14px 32px 12px 20px', minWidth: 0 }}>
          <SectionTitle>Invoice Status Mix</SectionTitle>
          <PieChart width={PIE_CHART_W} height={PIE_CHART_H}>
            <Pie
              data={statusBreakdown} dataKey="value" nameKey="name"
              cx="50%" cy="50%"
              innerRadius={36} outerRadius={58} paddingAngle={3} strokeWidth={0}
            >
              {statusBreakdown.map((s) => (
                <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? muted} />
              ))}
            </Pie>
            <Legend
              iconSize={6}
              formatter={(v) => <span style={{ fontFamily: head, fontSize: 7.5, color: sub }}>{v}</span>}
            />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} {...tooltipStyle} />
          </PieChart>
          {/* Status rows */}
          <div style={{ borderTop: `1px solid ${rule}`, paddingTop: 6 }}>
            {statusBreakdown.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s.name] ?? muted, flexShrink: 0 }} />
                  <span style={{ fontFamily: head, fontSize: 8.5, color: sub }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontFamily: head, fontSize: 8, color: muted }}>{s.count} inv.</span>
                  <span style={{ fontFamily: head, fontWeight: 700, fontSize: 8.5, color: ink }}>{formatCurrency(s.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TOP CLIENTS + TOP SERVICES ═══════════════════════════════════ */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${rule}` }}>

        <div style={{ flex: 1, padding: '12px 24px 12px 32px', borderRight: `1px solid ${rule}`, minWidth: 0 }}>
          <SectionTitle>Top Clients by Revenue</SectionTitle>
          {topClients.length === 0
            ? <p style={{ fontFamily: body, fontSize: 9, color: muted }}>No client data available.</p>
            : topClients.map((c, i) => (
              <BarRow
                key={c.name}
                label={`${i + 1}. ${c.name}`}
                amount={c.total}
                pct={topClients[0].total > 0 ? (c.total / topClients[0].total) * 100 : 0}
                color={i === 0 ? orange : '#60A5FA'}
                sub={`${c.invoices} invoice${c.invoices !== 1 ? 's' : ''} · ${formatCurrency(c.paid)} paid`}
              />
            ))
          }
        </div>

        <div style={{ flex: 1, padding: '12px 32px 12px 24px', minWidth: 0 }}>
          <SectionTitle>Top Services by Revenue</SectionTitle>
          {topServices.length === 0
            ? <p style={{ fontFamily: body, fontSize: 9, color: muted }}>No service data available.</p>
            : topServices.map((s, i) => (
              <BarRow
                key={s.name}
                label={`${i + 1}. ${s.name}`}
                amount={s.total}
                pct={topServices[0].total > 0 ? (s.total / topServices[0].total) * 100 : 0}
                color={i === 0 ? orange : '#A78BFA'}
                sub={`${s.count} line item${s.count !== 1 ? 's' : ''}`}
              />
            ))
          }
        </div>
      </div>

      {/* ══ COLLECTION HEALTH SUMMARY ════════════════════════════════════ */}
      <div style={{ padding: '12px 32px', borderBottom: `1px solid ${rule}`, background: bgGray }}>
        <SectionTitle>Collection Health</SectionTitle>
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          {/* Rate circle — plain CSS, no animation */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: display, fontSize: 36, color: collectionRate >= 80 ? '#22C55E' : collectionRate >= 50 ? orange : '#EF4444', lineHeight: 1 }}>
              {collectionRate}%
            </div>
            <div style={{ fontFamily: head, fontSize: 8, color: muted, marginTop: 2, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
              {collectionRate >= 80 ? 'Excellent' : collectionRate >= 60 ? 'Good' : collectionRate >= 40 ? 'Fair' : 'Needs attention'}
            </div>
          </div>

          {/* Breakdown bars */}
          <div style={{ flex: 1 }}>
            {[
              { label: 'Paid',        amount: totalPaid,        pct: paidPct,        color: '#22C55E' },
              { label: 'Outstanding', amount: totalOutstanding, pct: outstandingPct, color: '#60A5FA' },
              { label: 'Overdue',     amount: totalOverdue,     pct: overduePct,     color: '#EF4444' },
            ].map(({ label, amount, pct, color }) => (
              <div key={label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontFamily: head, fontSize: 8.5, color: sub }}>{label}</span>
                  <span style={{ fontFamily: head, fontSize: 8.5, fontWeight: 700, color: ink }}>{formatCurrency(amount)} <span style={{ fontWeight: 400, color: muted }}>({pct}%)</span></span>
                </div>
                <div style={{ height: 5, background: rule, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flexShrink: 0 }}>
            {[
              { label: 'Total Invoices', value: String(invoiceCount) },
              { label: 'Active Clients', value: String(clientCount) },
              { label: 'Avg. Value',     value: formatCurrency(avgValue) },
              { label: 'Total Invoiced', value: formatCurrency(totalInvoiced) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: white, border: `1px solid ${rule}`, borderRadius: 5, padding: '6px 10px', textAlign: 'center' as const }}>
                <div style={{ fontFamily: head, fontWeight: 700, fontSize: 10, color: ink }}>{value}</div>
                <div style={{ fontFamily: head, fontSize: 7, color: muted, marginTop: 1, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <div style={{ padding: '8px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${rule}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={tvecoLogo} alt="TVECO" style={{ height: 20, width: 'auto', opacity: 0.55 }} />
          <span style={{ fontFamily: head, fontSize: 8, color: muted }}>
            TVECO · <span style={{ color: '#C2410C' }}>tveco.co.za</span> · enquiries@tveco.co.za
          </span>
        </div>
        <span style={{ fontFamily: body, fontSize: 8.5, fontStyle: 'italic' as const, color: muted }}>
          Confidential — Internal Use Only
        </span>
      </div>

    </div>
  );
}
