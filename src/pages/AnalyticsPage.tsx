import { useState } from 'react';
import { motion } from 'framer-motion';
import { Printer, TrendingUp, DollarSign, Clock, AlertCircle, Users, FileText, Target, BarChart2 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { AnalyticsPrintLayout } from '../components/analytics/AnalyticsPrintLayout';
import { usePrint } from '../hooks/usePrint';
import { formatCurrency } from '../utils/formatCurrency';
import { todayISO } from '../utils/formatDate';
import {
  buildMonthlyRevenue, buildStatusBreakdown, buildTopClients, buildTopServices,
  collectionRate, avgInvoiceValue,
} from '../utils/analyticsData';
import dashboardBg from '../assets/tveco-dashboard-bg.jpg';

/* ── Design tokens ── */
const C = {
  orange: '#FF6B00', green: '#22C55E', blue: '#60A5FA',
  red: '#EF4444', purple: '#A78BFA', muted: '#9CA3AF',
};
const STATUS_COLORS: Record<string, string> = {
  PAID: C.green, SENT: C.blue, OVERDUE: C.red, DRAFT: '#5A6A7A',
};

/* ── Reusable KPI card ── */
function KpiCard({ label, value, sub, icon: Icon, color, delay }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5 hover:border-brand-muted transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: color + '18', color }}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-brand-muted text-xs mb-1">{label}</p>
      <p className="font-head font-bold text-brand-white text-lg sm:text-xl leading-tight">{value}</p>
      {sub && <p className="text-brand-muted text-xs mt-1">{sub}</p>}
    </motion.div>
  );
}

/* ── Chart card wrapper ── */
function ChartCard({ title, children, delay = 0, className = '' }: {
  title: string; children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={`bg-brand-card border border-brand-border rounded-xl overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 border-b border-brand-border">
        <h3 className="font-head font-bold text-brand-white text-sm">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </motion.div>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card2 border border-brand-border rounded-lg p-3 shadow-xl text-xs">
      {label && <p className="font-head text-brand-muted mb-2 uppercase tracking-wider text-[10px]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-brand-muted">{p.name}</span>
          </div>
          <span className="font-head font-bold text-brand-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ value, color, label, amount }: { value: number; color: string; label: string; amount: number }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-brand-text text-xs font-head truncate max-w-[55%]">{label}</span>
        <span className="font-head font-bold text-brand-white text-xs shrink-0">{formatCurrency(amount)}</span>
      </div>
      <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export function AnalyticsPage() {
  const { invoices } = useInvoices();
  const { clients }  = useClients();
  const { print }    = usePrint();
  const [monthsBack, setMonthsBack] = useState(7);

  /* ── Derived data ── */
  const monthly       = buildMonthlyRevenue(invoices, monthsBack);
  const statusData    = buildStatusBreakdown(invoices);
  const topClients    = buildTopClients(invoices, 6);
  const topServices   = buildTopServices(invoices, 6);
  const rate          = collectionRate(invoices);
  const avg           = avgInvoiceValue(invoices);
  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const totalPaid     = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => i.status === 'SENT').reduce((s, i) => s + i.total, 0);
  const totalOverdue  = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0);

  const kpis = [
    { label: 'Total Invoiced',   value: formatCurrency(totalInvoiced),   sub: `${invoices.length} invoices`,    icon: TrendingUp,  color: C.orange, delay: 0    },
    { label: 'Total Collected',  value: formatCurrency(totalPaid),        sub: `${rate}% collection rate`,       icon: DollarSign,  color: C.green,  delay: 0.06 },
    { label: 'Outstanding',      value: formatCurrency(totalOutstanding), sub: 'awaiting payment',               icon: Clock,       color: C.blue,   delay: 0.12 },
    { label: 'Overdue',          value: formatCurrency(totalOverdue),     sub: 'requires attention',             icon: AlertCircle, color: C.red,    delay: 0.18 },
    { label: 'Avg. Invoice',     value: formatCurrency(avg),              sub: 'per invoice',                    icon: BarChart2,   color: C.orange, delay: 0.24 },
    { label: 'Active Clients',   value: String(clients.length),           sub: `${topClients.length} with revenue`, icon: Users,    color: C.purple, delay: 0.30 },
    { label: 'Total Invoices',   value: String(invoices.length),          sub: 'all time',                       icon: FileText,    color: C.blue,   delay: 0.36 },
    { label: 'Collection Rate',  value: `${rate}%`,                       sub: 'paid vs billed',                 icon: Target,      color: C.green,  delay: 0.42 },
  ];

  return (
    <PageBackground image={dashboardBg} position="center 30%">

      <TopBar
        title="Analytics"
        subtitle="Business performance overview"
        actions={
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <select
              value={monthsBack}
              onChange={(e) => setMonthsBack(Number(e.target.value))}
              className="input-field w-auto text-xs py-1.5"
              aria-label="Select period"
            >
              <option value={3}>Last 3 months</option>
              <option value={7}>Last 7 months</option>
              <option value={12}>Last 12 months</option>
            </select>
            {/* Print / PDF */}
            <button
              onClick={print}
              className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B00' }}
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        }
      />

      {/* ══ SCREEN VIEW ══════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 print:hidden">

        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        {/* Revenue trend + Status mix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area chart — revenue trend */}
          <ChartCard title="Monthly Revenue Trend" delay={0.1} className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green}  stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.green}  stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}   stopOpacity={0.20} />
                    <stop offset="95%" stopColor={C.blue}   stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gOver" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.red}    stopOpacity={0.20} />
                    <stop offset="95%" stopColor={C.red}    stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252B35" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8A99AE', fontSize: 11, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A99AE', fontSize: 11, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `R${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#252B35' }} />
                <Area type="monotone" dataKey="paid"        name="Paid"        stroke={C.green}  strokeWidth={2} fill="url(#gPaid)" dot={false} activeDot={{ r: 4, fill: C.green }} />
                <Area type="monotone" dataKey="outstanding" name="Outstanding" stroke={C.blue}   strokeWidth={2} fill="url(#gOut)"  dot={false} activeDot={{ r: 4, fill: C.blue  }} />
                <Area type="monotone" dataKey="overdue"     name="Overdue"     stroke={C.red}    strokeWidth={2} fill="url(#gOver)" dot={false} activeDot={{ r: 4, fill: C.red   }} />
              </AreaChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex gap-5 mt-2 justify-center">
              {[{ color: C.green, label: 'Paid' }, { color: C.blue, label: 'Outstanding' }, { color: C.red, label: 'Overdue' }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-brand-muted text-xs font-head">{label}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Donut — status mix */}
          <ChartCard title="Invoice Status Mix" delay={0.15}>
            {statusData.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-8">No data yet</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      innerRadius={52} outerRadius={76} paddingAngle={4} strokeWidth={0}>
                      {statusData.map((s) => (
                        <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? C.muted} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={{ background: '#1E2530', border: '1px solid #252B35', borderRadius: 8, fontFamily: 'Space Grotesk', fontSize: 11 }}
                      labelStyle={{ color: '#8A99AE' }} itemStyle={{ color: '#F0F4F8' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {statusData.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] ?? C.muted }} />
                        <span className="text-brand-muted font-head">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-brand-muted">{s.count} inv.</span>
                        <span className="font-head font-bold text-brand-white">{formatCurrency(s.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* Monthly bar + Top clients + Top services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Grouped bar chart */}
          <ChartCard title="Revenue by Month (Grouped)" delay={0.2}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#252B35" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#8A99AE', fontSize: 10, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A99AE', fontSize: 10, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `R${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,107,0,0.05)' }} />
                <Bar dataKey="paid"        name="Paid"        fill={C.green}  radius={[3, 3, 0, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill={C.blue}   radius={[3, 3, 0, 0]} />
                <Bar dataKey="overdue"     name="Overdue"     fill={C.red}    radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top clients */}
          <ChartCard title="Top Clients by Revenue" delay={0.25}>
            {topClients.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-8">No client data yet</p>
            ) : (
              topClients.map((c, i) => {
                const pct = topClients[0].total > 0 ? (c.total / topClients[0].total) * 100 : 0;
                return (
                  <ProgressBar
                    key={c.name}
                    label={c.name}
                    amount={c.total}
                    value={pct}
                    color={i === 0 ? C.orange : C.blue}
                  />
                );
              })
            )}
          </ChartCard>

          {/* Top services */}
          <ChartCard title="Top Services by Revenue" delay={0.30}>
            {topServices.length === 0 ? (
              <p className="text-brand-muted text-sm text-center py-8">No line item data yet</p>
            ) : (
              topServices.map((s, i) => {
                const pct = topServices[0].total > 0 ? (s.total / topServices[0].total) * 100 : 0;
                return (
                  <ProgressBar
                    key={s.name}
                    label={s.name}
                    amount={s.total}
                    value={pct}
                    color={i === 0 ? C.orange : C.purple}
                  />
                );
              })
            )}
          </ChartCard>
        </div>

        {/* Collection rate visual */}
        <ChartCard title="Collection Health" delay={0.35}>
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            {/* Rate gauge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#252B35" strokeWidth="10" />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    fill="none" stroke={rate >= 80 ? C.green : rate >= 50 ? C.orange : C.red}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - rate / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl text-brand-white">{rate}%</span>
                  <span className="font-head text-[10px] text-brand-muted uppercase tracking-wider">Collected</span>
                </div>
              </div>
              <p className="text-brand-muted text-xs mt-2 font-head">{rate >= 80 ? 'Excellent' : rate >= 60 ? 'Good' : rate >= 40 ? 'Fair' : 'Needs attention'}</p>
            </div>

            {/* Breakdown bars */}
            <div className="flex-1 w-full space-y-3">
              <ProgressBar label="Paid" amount={totalPaid} value={totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0} color={C.green} />
              <ProgressBar label="Outstanding" amount={totalOutstanding} value={totalInvoiced > 0 ? (totalOutstanding / totalInvoiced) * 100 : 0} color={C.blue} />
              <ProgressBar label="Overdue" amount={totalOverdue} value={totalInvoiced > 0 ? (totalOverdue / totalInvoiced) * 100 : 0} color={C.red} />
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { label: 'Avg. Invoice', value: formatCurrency(avg) },
                { label: 'Clients',      value: String(clients.length) },
                { label: 'Paid',         value: String(invoices.filter((i) => i.status === 'PAID').length) },
                { label: 'Overdue',      value: String(invoices.filter((i) => i.status === 'OVERDUE').length) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-brand-card2 rounded-lg p-3 text-center border border-brand-border">
                  <p className="font-head font-bold text-brand-white text-sm">{value}</p>
                  <p className="text-brand-muted text-[10px] font-head uppercase tracking-wide mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

      </div>

      {/* ══ PRINT LAYOUT — only visible when printing ══════════════════ */}
      <div className="hidden print:block">
        <AnalyticsPrintLayout
          monthly={monthly}
          statusBreakdown={statusData}
          topClients={topClients}
          topServices={topServices}
          totalInvoiced={totalInvoiced}
          totalPaid={totalPaid}
          totalOutstanding={totalOutstanding}
          totalOverdue={totalOverdue}
          collectionRate={rate}
          avgValue={avg}
          invoiceCount={invoices.length}
          clientCount={clients.length}
          generatedDate={todayISO()}
        />
      </div>

    </PageBackground>
  );
}
