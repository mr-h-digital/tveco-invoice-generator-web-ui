import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Clock3,
  DollarSign,
  FileCheck2,
  FileText,
  Plus,
  Ship,
  TriangleAlert,
  Users,
  Wallet,
} from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import { useExportJobs } from '../hooks/useExportJobs';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from '../components/shared/Badge';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateShort, todayISO } from '../utils/formatDate';
import { useAuthStore } from '../store/authStore';
import dashboardBg from '../assets/tveco-dashboard-bg.jpg';

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5 hover:border-brand-muted transition-colors"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="text-brand-muted text-xs sm:text-sm mb-1">{label}</p>
      <p className="font-head font-bold text-brand-white text-lg sm:text-2xl leading-tight">{value}</p>
      <p className="text-brand-muted text-xs mt-1">{subtext}</p>
    </motion.div>
  );
}

function SectionCard({
  title,
  action,
  children,
  delay = 0,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
      className="bg-brand-card border border-brand-border rounded-xl overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-4 border-b border-brand-border gap-3">
        <h2 className="font-head font-bold text-brand-white text-sm sm:text-base">{title}</h2>
        {action}
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </motion.section>
  );
}

function QuickAction({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-card2 px-4 py-3 text-sm text-brand-text hover:border-brand-muted hover:bg-brand-card transition-colors"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-brand-white shrink-0">
          <Icon size={16} />
        </span>
        <span className="truncate">{label}</span>
      </span>
      <ArrowRight size={15} className="text-brand-muted shrink-0" />
    </Link>
  );
}

function AttentionItem({
  title,
  detail,
  tone,
  href,
}: {
  title: string;
  detail: string;
  tone: 'danger' | 'warn' | 'info';
  href: string;
}) {
  const toneClass = tone === 'danger'
    ? 'border-red-500/25 bg-red-500/10 text-red-300'
    : tone === 'warn'
      ? 'border-orange/25 bg-orange/10 text-orange'
      : 'border-blue-500/25 bg-blue-500/10 text-blue-300';

  return (
    <Link to={href} className={`block rounded-xl border px-4 py-3 transition-colors hover:opacity-90 ${toneClass}`}>
      <p className="font-head text-sm font-bold">{title}</p>
      <p className="text-xs mt-1 opacity-85">{detail}</p>
    </Link>
  );
}

export function DashboardPage() {
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { clients, loading: clientsLoading } = useClients();
  const { jobs, loading: jobsLoading } = useExportJobs();
  const { unreadCount, outboxFailed, outboxPending } = useNotifications();
  const user = useAuthStore((s) => s.user);

  const today = todayISO();

  const invoiceSummary = invoices.reduce(
    (acc, invoice) => {
      acc.totalInvoiced += invoice.total;
      if (invoice.status === 'PAID') acc.totalCollected += invoice.total;
      if (invoice.status === 'SENT') acc.outstanding += invoice.total;
      if (invoice.status === 'OVERDUE') {
        acc.overdue += invoice.total;
        acc.overdueCount += 1;
      }
      return acc;
    },
    { totalInvoiced: 0, totalCollected: 0, outstanding: 0, overdue: 0, overdueCount: 0 }
  );

  const quoteSummary = quotes.reduce(
    (acc, quote) => {
      if (quote.status === 'DRAFT') acc.draft += 1;
      if (quote.status === 'SENT') acc.sent += 1;
      if (quote.status === 'ACCEPTED') acc.accepted += 1;
      if (quote.status === 'EXPIRED') acc.expired += 1;
      return acc;
    },
    { draft: 0, sent: 0, accepted: 0, expired: 0 }
  );

  const activeJobs = jobs.filter((job) => job.status !== 'DELIVERED');
  const shippingJobs = jobs.filter((job) => job.status === 'SHIPPING');
  const overdueMilestones = jobs.flatMap((job) =>
    job.paymentMilestones
      .filter((milestone) => !milestone.paid && milestone.dueDate < today)
      .map((milestone) => ({
        jobId: job.id,
        jobNumber: job.jobNumber,
        companyName: job.clientSnapshot.companyName,
        label: milestone.label,
        dueDate: milestone.dueDate,
        amount: milestone.amount,
      }))
  );

  const expiringQuotes = quotes
    .filter((quote) => quote.status === 'SENT' && quote.expiryDate <= today)
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
    .slice(0, 3);

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const recentNotifications = [...(useNotifications().notifications ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const loading = invoicesLoading || quotesLoading || clientsLoading || jobsLoading;

  const kpis = [
    {
      label: 'Receivables',
      value: formatCurrency(invoiceSummary.outstanding + invoiceSummary.overdue),
      subtext: `${invoiceSummary.overdueCount} overdue invoice${invoiceSummary.overdueCount === 1 ? '' : 's'}`,
      icon: Wallet,
      color: '#FF6B00',
      delay: 0,
    },
    {
      label: 'Open Quotes',
      value: String(quoteSummary.draft + quoteSummary.sent),
      subtext: `${quoteSummary.accepted} accepted · ${quoteSummary.expired} expired`,
      icon: FileText,
      color: '#60A5FA',
      delay: 0.08,
    },
    {
      label: 'Active Export Jobs',
      value: String(activeJobs.length),
      subtext: `${shippingJobs.length} currently shipping`,
      icon: Ship,
      color: '#2DD4BF',
      delay: 0.16,
    },
    {
      label: 'Unread Notifications',
      value: String(unreadCount),
      subtext: `${outboxPending} pending emails · ${outboxFailed} failed`,
      icon: Bell,
      color: '#A78BFA',
      delay: 0.24,
    },
  ];

  return (
    <PageBackground image={dashboardBg} position="center 30%">
      <TopBar
        title="Operations Hub"
        subtitle={`Welcome back${user?.email ? `, ${user.email.split('@')[0]}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/invoices/new" className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-2 text-brand-text text-sm font-medium rounded-lg border border-brand-border hover:bg-brand-card2 transition-colors">
              <Plus size={15} /> Invoice
            </Link>
            <Link to="/quotes/new" className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-2 text-brand-text text-sm font-medium rounded-lg border border-brand-border hover:bg-brand-card2 transition-colors">
              <Plus size={15} /> Quote
            </Link>
            <Link to="/exports" className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
              <Plus size={16} />
              <span className="hidden lg:inline">New Export Job</span>
              <span className="lg:hidden">New</span>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <SectionCard title="Needs Attention" delay={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overdueMilestones.slice(0, 2).map((milestone) => (
                  <AttentionItem
                    key={`${milestone.jobId}-${milestone.label}`}
                    href="/exports"
                    tone="danger"
                    title={`${milestone.jobNumber} payment overdue`}
                    detail={`${milestone.label} for ${milestone.companyName} was due ${formatDateShort(milestone.dueDate)} · ${formatCurrency(milestone.amount)}`}
                  />
                ))}
                {expiringQuotes.slice(0, 2).map((quote) => (
                  <AttentionItem
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    tone="warn"
                    title={`${quote.quoteNumber} requires follow-up`}
                    detail={`${quote.clientSnapshot.companyName} reached expiry on ${formatDateShort(quote.expiryDate)}`}
                  />
                ))}
                {invoiceSummary.overdueCount > 0 && (
                  <AttentionItem
                    href="/invoices"
                    tone="danger"
                    title="Overdue invoices need action"
                    detail={`${invoiceSummary.overdueCount} invoice${invoiceSummary.overdueCount === 1 ? '' : 's'} overdue · ${formatCurrency(invoiceSummary.overdue)}`}
                  />
                )}
                {outboxFailed > 0 && (
                  <AttentionItem
                    href="/notifications"
                    tone="info"
                    title="Email delivery failures detected"
                    detail={`${outboxFailed} outbox message${outboxFailed === 1 ? '' : 's'} failed and may need retry.`}
                  />
                )}
                {overdueMilestones.length === 0 && expiringQuotes.length === 0 && invoiceSummary.overdueCount === 0 && outboxFailed === 0 && (
                  <div className="md:col-span-2 rounded-xl border border-brand-border bg-brand-card2 px-4 py-5 text-sm text-brand-muted">
                    No urgent operational alerts right now.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Recent Activity"
              action={<Link to="/invoices" className="flex items-center gap-1 text-sm text-brand-muted hover:text-orange transition-colors">View invoices <ArrowRight size={14} /></Link>}
              delay={0.16}
            >
              {loading ? (
                <div className="text-sm text-brand-muted">Loading…</div>
              ) : recentInvoices.length === 0 ? (
                <div className="text-sm text-brand-muted">No invoice activity yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-card2 px-4 py-3 hover:border-brand-muted transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm text-brand-white font-medium truncate">{invoice.clientSnapshot.companyName}</p>
                        <p className="text-xs text-brand-muted">{invoice.invoiceNumber} · Due {formatDateShort(invoice.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge status={invoice.status} />
                        <span className="font-head text-sm font-bold text-brand-white">{formatCurrency(invoice.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Export Pipeline"
              action={<Link to="/exports" className="flex items-center gap-1 text-sm text-brand-muted hover:text-orange transition-colors">Open pipeline <ArrowRight size={14} /></Link>}
              delay={0.22}
            >
              {jobsLoading ? (
                <div className="text-sm text-brand-muted">Loading…</div>
              ) : recentJobs.length === 0 ? (
                <div className="text-sm text-brand-muted">No export jobs yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => {
                    const completed = job.milestones.filter((milestone) => !!milestone.completedAt).length;
                    const progress = Math.round((completed / Math.max(job.milestones.length, 1)) * 100);
                    return (
                      <Link key={job.id} to="/exports" className="block rounded-xl border border-brand-border bg-brand-card2 px-4 py-3 hover:border-brand-muted transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm text-brand-white font-medium truncate">{job.jobNumber}</p>
                            <p className="text-xs text-brand-muted truncate">{job.clientSnapshot.companyName} · {job.destinationCountry}</p>
                          </div>
                          <span className="text-xs font-head rounded-full px-2 py-1 bg-white/5 text-brand-text shrink-0">{job.status}</span>
                        </div>
                        <div className="h-2 rounded-full bg-brand-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#FF6B00' }} />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-brand-muted">
                          <span>{progress}% complete</span>
                          <span>ETA {formatDateShort(job.estimatedArrivalDate)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Quick Actions" delay={0.12}>
              <div className="space-y-3">
                <QuickAction to="/invoices/new" label="Create invoice" icon={DollarSign} />
                <QuickAction to="/quotes/new" label="Create quote" icon={FileText} />
                <QuickAction to="/exports" label="Manage export jobs" icon={Ship} />
                <QuickAction to="/clients" label="Add or update clients" icon={Users} />
              </div>
            </SectionCard>

            <SectionCard title="Commercial Snapshot" delay={0.18}>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-brand-muted">Total invoiced</span>
                  <span className="font-head text-brand-white font-bold">{formatCurrency(invoiceSummary.totalInvoiced)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-brand-muted">Collected</span>
                  <span className="font-head text-emerald-400 font-bold">{formatCurrency(invoiceSummary.totalCollected)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-brand-muted">Draft / sent quotes</span>
                  <span className="font-head text-brand-white font-bold">{quoteSummary.draft + quoteSummary.sent}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-brand-muted">Clients</span>
                  <span className="font-head text-brand-white font-bold">{clients.length}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-brand-muted">Shipping jobs</span>
                  <span className="font-head text-brand-white font-bold">{shippingJobs.length}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Notifications" delay={0.24}>
              {recentNotifications.length === 0 ? (
                <div className="text-sm text-brand-muted">No notifications yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentNotifications.map((notification) => (
                    <Link key={notification.id} to="/notifications" className="block rounded-xl border border-brand-border bg-brand-card2 px-4 py-3 hover:border-brand-muted transition-colors">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${notification.read ? 'bg-brand-border' : 'bg-orange'}`} />
                        <div className="min-w-0">
                          <p className="text-sm text-brand-white font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-brand-muted mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-[11px] text-brand-muted mt-2">{formatDateShort(notification.createdAt.split('T')[0])}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Pipeline Risks" delay={0.3}>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-card2 px-4 py-3">
                  <TriangleAlert size={16} className="text-orange mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-brand-white font-medium">Overdue payment milestones</p>
                    <p className="text-xs text-brand-muted mt-1">{overdueMilestones.length} milestone{overdueMilestones.length === 1 ? '' : 's'} overdue across active jobs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-card2 px-4 py-3">
                  <Clock3 size={16} className="text-blue-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-brand-white font-medium">Quotes awaiting conversion</p>
                    <p className="text-xs text-brand-muted mt-1">{quoteSummary.sent} sent quote{quoteSummary.sent === 1 ? '' : 's'} still open for follow-up.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-card2 px-4 py-3">
                  <FileCheck2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-brand-white font-medium">Outbox health</p>
                    <p className="text-xs text-brand-muted mt-1">{outboxPending} pending · {outboxFailed} failed email message{outboxPending + outboxFailed === 1 ? '' : 's'}.</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
