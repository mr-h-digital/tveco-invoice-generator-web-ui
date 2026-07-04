import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
}

const orange = '#FF6B00';
const dark   = '#111318';
const ink    = '#111827';
const sub    = '#374151';
const muted  = '#6B7280';
const rule   = '#E5E7EB';
const bgGray = '#F9FAFB';
const white  = '#FFFFFF';
const head   = "'Space Grotesk', sans-serif";
const body   = "'Outfit', sans-serif";
const display = "'Bebas Neue', sans-serif";

const STATUS_COLORS: Record<string, string> = {
  PAID: '#22C55E', SENT: '#60A5FA', OVERDUE: '#EF4444', DRAFT: '#9CA3AF',
};

function KpiCard({ label, value, sub: subText, color = orange }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: bgGray, border: `1px solid ${rule}`, borderRadius: 6, padding: '12px 14px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontFamily: head, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: muted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: head, fontWeight: 700, fontSize: 16, color: ink, lineHeight: 1 }}>{value}</div>
      {subText && <div style={{ fontFamily: body, fontSize: 10, color: muted, marginTop: 4 }}>{subText}</div>}
    </div>
  );
}

export function AnalyticsPrintLayout({
  monthly, statusBreakdown, topClients, topServices,
  totalInvoiced, totalPaid, totalOutstanding, totalOverdue,
  collectionRate, avgValue, invoiceCount, clientCount, generatedDate,
}: Props) {
  return (
    <div id="analytics-print-area" style={{ fontFamily: body, color: ink, background: white, width: '100%', fontSize: 11 }}>

      {/* ── HEADER ── */}
      <div style={{ background: dark, borderBottom: `4px solid ${orange}`, padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={tvecoLogo} alt="TVECO" style={{ height: 56, width: 'auto', mixBlendMode: 'lighten' as const }} />
          <div>
            <div style={{ fontFamily: display, fontSize: 26, color: '#F0F4F8', letterSpacing: 2, lineHeight: 1 }}>TVECO</div>
            <div style={{ fontFamily: head, fontSize: 8, color: orange, letterSpacing: '0.15em', marginTop: 4, textTransform: 'uppercase' as const }}>
              Business Analytics Report
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: head, fontSize: 9, color: orange, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 4 }}>Generated</div>
          <div style={{ fontFamily: head, fontWeight: 600, fontSize: 12, color: '#F0F4F8' }}>{formatDate(generatedDate)}</div>
          <div style={{ fontFamily: body, fontSize: 10, color: '#8A99AE', marginTop: 2 }}>Timeline Vehicle Export Co. (Pty) Ltd</div>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ padding: '16px 32px', background: bgGray, borderBottom: `1px solid ${rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          <KpiCard label="Total Invoiced"  value={formatCurrency(totalInvoiced)}  sub={`${invoiceCount} invoices`} color={orange} />
          <KpiCard label="Total Paid"      value={formatCurrency(totalPaid)}       sub={`${Math.round((totalPaid / (totalInvoiced || 1)) * 100)}% of total`} color="#22C55E" />
          <KpiCard label="Outstanding"     value={formatCurrency(totalOutstanding)} color="#60A5FA" />
          <KpiCard label="Overdue"         value={formatCurrency(totalOverdue)}     color="#EF4444" />
          <KpiCard label="Collection Rate" value={`${collectionRate}%`}             sub="paid vs sent" color="#22C55E" />
          <KpiCard label="Avg. Invoice"    value={formatCurrency(avgValue)}         sub={`${clientCount} clients`} color={orange} />
        </div>
      </div>

      {/* ── REVENUE TREND + STATUS PIE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 0, borderBottom: `1px solid ${rule}` }}>

        {/* Bar chart */}
        <div style={{ padding: '16px 24px 16px 32px', borderRight: `1px solid ${rule}` }}>
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 11, color: ink, marginBottom: 12 }}>Monthly Revenue Trend</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthly} margin={{ top: 2, right: 4, left: -10, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke={rule} vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: head, fontSize: 8, fill: muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: head, fontSize: 8, fill: muted }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `R${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ fontFamily: head, fontSize: 9, background: white, border: `1px solid ${rule}`, borderRadius: 4 }}
              />
              <Bar dataKey="paid"        name="Paid"        fill="#22C55E" radius={[2, 2, 0, 0]} />
              <Bar dataKey="outstanding" name="Outstanding" fill="#60A5FA" radius={[2, 2, 0, 0]} />
              <Bar dataKey="overdue"     name="Overdue"     fill="#EF4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
            {[{ color: '#22C55E', label: 'Paid' }, { color: '#60A5FA', label: 'Outstanding' }, { color: '#EF4444', label: 'Overdue' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontFamily: head, fontSize: 8, color: muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div style={{ padding: '16px 32px 16px 20px' }}>
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 11, color: ink, marginBottom: 8 }}>Invoice Status Mix</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%"
                innerRadius={38} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                {statusBreakdown.map((s) => (
                  <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? muted} />
                ))}
              </Pie>
              <Legend formatter={(v) => <span style={{ fontFamily: head, fontSize: 8, color: sub }}>{v}</span>} iconSize={7} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ fontFamily: head, fontSize: 9, background: white, border: `1px solid ${rule}`, borderRadius: 4 }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Status table */}
          <div style={{ borderTop: `1px solid ${rule}`, marginTop: 6, paddingTop: 8 }}>
            {statusBreakdown.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[s.name] ?? muted }} />
                  <span style={{ fontFamily: head, fontSize: 9, color: sub }}>{s.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontFamily: head, fontSize: 9, color: muted }}>{s.count} inv.</span>
                  <span style={{ fontFamily: head, fontWeight: 700, fontSize: 9, color: ink }}>{formatCurrency(s.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOP CLIENTS + TOP SERVICES ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: `1px solid ${rule}` }}>

        {/* Top clients */}
        <div style={{ padding: '14px 24px 14px 32px', borderRight: `1px solid ${rule}` }}>
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 11, color: ink, marginBottom: 10 }}>Top Clients by Revenue</div>
          {topClients.map((c, i) => {
            const pct = topClients[0].total > 0 ? (c.total / topClients[0].total) * 100 : 0;
            return (
              <div key={c.name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: body, fontSize: 9, color: i === 0 ? ink : sub, fontWeight: i === 0 ? 600 : 400, maxWidth: '60%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {i + 1}. {c.name}
                  </span>
                  <span style={{ fontFamily: head, fontSize: 9, fontWeight: 700, color: ink }}>{formatCurrency(c.total)}</span>
                </div>
                <div style={{ height: 4, background: rule, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? orange : '#60A5FA', borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: head, fontSize: 8, color: muted, marginTop: 2 }}>{c.invoices} invoice{c.invoices !== 1 ? 's' : ''} · {formatCurrency(c.paid)} paid</div>
              </div>
            );
          })}
        </div>

        {/* Top services */}
        <div style={{ padding: '14px 32px 14px 24px' }}>
          <div style={{ fontFamily: head, fontWeight: 700, fontSize: 11, color: ink, marginBottom: 10 }}>Top Services by Revenue</div>
          {topServices.map((s, i) => {
            const pct = topServices[0].total > 0 ? (s.total / topServices[0].total) * 100 : 0;
            return (
              <div key={s.name} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: body, fontSize: 9, color: i === 0 ? ink : sub, fontWeight: i === 0 ? 600 : 400, maxWidth: '65%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {i + 1}. {s.name}
                  </span>
                  <span style={{ fontFamily: head, fontSize: 9, fontWeight: 700, color: ink }}>{formatCurrency(s.total)}</span>
                </div>
                <div style={{ height: 4, background: rule, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? orange : '#A78BFA', borderRadius: 2 }} />
                </div>
                <div style={{ fontFamily: head, fontSize: 8, color: muted, marginTop: 2 }}>{s.count} line item{s.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: `1px solid ${rule}`, padding: '9px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={tvecoLogo} alt="TVECO" style={{ height: 22, width: 'auto', opacity: 0.6 }} />
          <span style={{ fontFamily: head, fontSize: 8, color: muted }}>
            TVECO · <span style={{ color: '#C2410C' }}>tveco.co.za</span> · enquiries@tveco.co.za
          </span>
        </div>
        <span style={{ fontFamily: body, fontSize: 9, fontStyle: 'italic', color: muted }}>Confidential — Internal Use Only</span>
      </div>

    </div>
  );
}
