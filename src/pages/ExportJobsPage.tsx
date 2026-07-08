import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Ship, CheckCircle2, Circle, ArrowRight, Bell, Wallet, Send } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { EmptyState } from '../components/shared/EmptyState';
import { Modal } from '../components/shared/Modal';
import { useExportJobs } from '../hooks/useExportJobs';
import { useClients } from '../hooks/useClients';
import { useNotifications } from '../hooks/useNotifications';
import type { ExportJob, ExportJobStatus } from '../types/exportJob';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { formatDateShort, todayISO } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_LABELS: Record<ExportJobStatus, string> = {
  ENQUIRY: 'Enquiry',
  SOURCING: 'Sourcing',
  DOCUMENTATION: 'Documentation',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
};

const STATUS_BADGE: Record<ExportJobStatus, { fg: string; bg: string }> = {
  ENQUIRY: { fg: '#FBBF24', bg: 'rgba(251,191,36,0.16)' },
  SOURCING: { fg: '#60A5FA', bg: 'rgba(96,165,250,0.16)' },
  DOCUMENTATION: { fg: '#A78BFA', bg: 'rgba(167,139,250,0.18)' },
  SHIPPING: { fg: '#2DD4BF', bg: 'rgba(45,212,191,0.16)' },
  DELIVERED: { fg: '#22C55E', bg: 'rgba(34,197,94,0.16)' },
};

const TABS: Array<{ value: ExportJobStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'ENQUIRY', label: 'Enquiry' },
  { value: 'SOURCING', label: 'Sourcing' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'DELIVERED', label: 'Delivered' },
];

function progressRatio(job: ExportJob) {
  const total = job.milestones.length;
  const done = job.milestones.filter((m) => !!m.completedAt).length;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function requiredDocsStatus(job: ExportJob) {
  const required = job.documents.filter((d) => d.required);
  const completed = required.filter((d) => d.completed).length;
  return { completed, total: required.length };
}

export function ExportJobsPage() {
  const { jobs, loading, addJob, advanceStatus, toggleDocument, togglePaymentMilestone, runPaymentReminderCheck } = useExportJobs();
  const { clients } = useClients();
  const {
    notifications,
    markAsRead,
    outboxPending,
    outboxFailed,
    outboxSent,
    dispatchOutbox,
    dispatchingOutbox,
  } = useNotifications();

  const [filter, setFilter] = useState<ExportJobStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    clientId: '',
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    destinationCountry: '',
    vehicleDescription: '',
    sourceChannel: 'Website' as ExportJob['sourceChannel'],
    estimatedDepartureDate: todayISO(),
    estimatedArrivalDate: '',
    projectValue: '',
    notes: '',
  });

  const filtered = useMemo(() => {
    return jobs
      .filter((j) => filter === 'all' || j.status === filter)
      .filter((j) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          j.jobNumber.toLowerCase().includes(q) ||
          j.clientSnapshot.companyName.toLowerCase().includes(q) ||
          j.destinationCountry.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, jobs, search]);

  function handleClientPick(clientId: string) {
    setDraft((prev) => {
      const client = clients.find((c) => c.id === clientId);
      if (!client) {
        return { ...prev, clientId };
      }
      return {
        ...prev,
        clientId,
        companyName: client.companyName,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
      };
    });
  }

  async function handleCreateJob() {
    const companyName = draft.companyName.trim();
    const contactName = draft.contactName.trim();
    const email = draft.email.trim();
    const phone = draft.phone.trim();
    const destinationCountry = draft.destinationCountry.trim();
    const vehicleDescription = draft.vehicleDescription.trim();
    const projectValue = Number(draft.projectValue);

    if (!companyName || !contactName || !email || !phone || !destinationCountry || !vehicleDescription || !Number.isFinite(projectValue) || projectValue <= 0) {
      toast.error('Please complete all required fields');
      return;
    }

    await addJob({
      clientId: draft.clientId || null,
      clientSnapshot: { companyName, contactName, email, phone },
      destinationCountry,
      vehicleDescription,
      sourceChannel: draft.sourceChannel,
      projectValue,
      estimatedDepartureDate: draft.estimatedDepartureDate,
      estimatedArrivalDate: draft.estimatedArrivalDate || undefined,
      notes: draft.notes,
    });

    toast.success('Export job created');
    setModalOpen(false);
    setDraft({
      clientId: '',
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      destinationCountry: '',
      vehicleDescription: '',
      sourceChannel: 'Website',
      estimatedDepartureDate: todayISO(),
      estimatedArrivalDate: '',
      projectValue: '',
      notes: '',
    });
  }

  async function handleAdvanceStatus(jobId: string) {
    const updated = await advanceStatus(jobId);
    if (!updated) {
      toast.error('Could not update export stage');
      return;
    }
    toast.success(`Moved to ${STATUS_LABELS[updated.status]}`);
  }

  async function handleToggleDocument(jobId: string, key: string) {
    const updated = await toggleDocument(jobId, key);
    if (!updated) {
      toast.error('Could not update document status');
      return;
    }
    toast.success('Document checklist updated');
  }

  async function handleTogglePayment(jobId: string, key: string) {
    const updated = await togglePaymentMilestone(jobId, key);
    if (!updated) {
      toast.error('Could not update payment milestone');
      return;
    }
    toast.success('Payment milestone updated');
  }

  async function handleRunReminders() {
    const count = await runPaymentReminderCheck();
    if (count === 0) {
      toast.success('No overdue payment milestones found');
      return;
    }
    toast.success(`${count} payment reminder${count > 1 ? 's' : ''} queued`);
  }

  async function handleDispatchOutbox() {
    const result = await dispatchOutbox();
    if (result.skipped) {
      toast.error('Email webhook not configured. Set VITE_NOTIFICATION_WEBHOOK_URL to enable dispatch.');
      return;
    }

    if (result.sent === 0 && result.failed === 0) {
      toast.success('No pending emails to dispatch');
      return;
    }

    if (result.failed > 0) {
      toast.error(`Dispatch complete: ${result.sent} sent, ${result.failed} failed`);
      return;
    }

    toast.success(`Dispatch complete: ${result.sent} sent`);
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar
        title="Export Jobs"
        subtitle={`${jobs.length} active pipeline records`}
        actions={
          <div className="flex items-center gap-2">
            <button
              data-tour-id="exports-new-button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B00' }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Export Job</span>
              <span className="sm:hidden">New</span>
            </button>
            <button
              onClick={handleRunReminders}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 text-brand-text text-sm font-medium rounded-lg border border-brand-border hover:bg-brand-card2 transition-colors"
            >
              <Bell size={15} />
              Run Reminders
            </button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex bg-brand-card border border-brand-border rounded-lg p-1 gap-1 overflow-x-auto shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap"
                style={filter === tab.value ? { background: '#FF6B00', color: '#fff', fontWeight: 500 } : { color: '#8A99AE' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search job number, client, destination..."
              className="input-field pl-9 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-brand-card border border-brand-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-brand-border rounded w-1/3 mb-3" />
                <div className="h-5 bg-brand-border rounded w-2/3 mb-2" />
                <div className="h-3 bg-brand-border rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Ship size={28} />}
            title={search || filter !== 'all' ? 'No matching export jobs' : 'No export jobs yet'}
            description={search || filter !== 'all' ? 'Try a different search or stage filter.' : 'Create your first export job to track sourcing, documentation, and shipping.'}
            action={
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: '#FF6B00' }}
              >
                Create Export Job
              </button>
            }
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((job, idx) => {
                const pct = progressRatio(job);
                const docs = requiredDocsStatus(job);
                const statusUi = STATUS_BADGE[job.status];
                const canAdvance = job.status !== 'DELIVERED';

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="bg-brand-card border border-brand-border rounded-xl overflow-hidden"
                  >
                    <div className="px-4 sm:px-5 py-4 border-b border-brand-border">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-head text-xs text-brand-muted">{job.jobNumber}</p>
                          <p className="font-medium text-brand-white text-sm truncate">{job.clientSnapshot.companyName}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-head" style={{ color: statusUi.fg, background: statusUi.bg }}>
                          {STATUS_LABELS[job.status]}
                        </span>
                      </div>
                      <p className="text-brand-text text-sm truncate">{job.vehicleDescription}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 text-xs text-brand-muted">
                        <span>To: {job.destinationCountry}</span>
                        <span>ETA: {formatDateShort(job.estimatedArrivalDate)}</span>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 py-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-brand-muted">Pipeline Progress</p>
                          <p className="text-xs font-head text-brand-text">{pct}%</p>
                        </div>
                        <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#FF6B00' }} />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-brand-muted mb-2">Required Documents</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {job.documents.filter((d) => d.required).map((doc) => (
                            <button
                              key={doc.key}
                              onClick={() => handleToggleDocument(job.id, doc.key)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-brand-border text-left hover:bg-brand-card2 transition-colors"
                            >
                              {doc.completed ? (
                                <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
                              ) : (
                                <Circle size={14} className="text-brand-muted" />
                              )}
                              <span className="text-xs text-brand-text truncate">{doc.label}</span>
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-brand-muted mt-1.5">
                          Completed: {docs.completed}/{docs.total}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-brand-muted mb-2">Payment Milestones</p>
                        <div className="space-y-1.5">
                          {job.paymentMilestones.map((ms) => (
                            <button
                              key={ms.key}
                              onClick={() => handleTogglePayment(job.id, ms.key)}
                              className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border border-brand-border text-left hover:bg-brand-card2 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {ms.paid ? (
                                  <CheckCircle2 size={14} style={{ color: '#22C55E' }} />
                                ) : (
                                  <Wallet size={14} className="text-brand-muted" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs text-brand-text truncate">{ms.label}</p>
                                  <p className="text-[11px] text-brand-muted">Due {formatDateShort(ms.dueDate)}</p>
                                </div>
                              </div>
                              <span className="text-xs font-head text-brand-white">{formatCurrency(ms.amount)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleAdvanceStatus(job.id)}
                          disabled={!canAdvance}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium enabled:hover:opacity-90 disabled:opacity-40 transition-opacity"
                          style={{ background: '#FF6B00', color: '#fff' }}
                        >
                          Advance Stage
                          <ArrowRight size={13} />
                        </button>
                        <span className="text-xs text-brand-muted">Tracking: {job.publicTrackingToken}</span>
                        <Link
                          to={`/track/${job.publicTrackingToken}`}
                          className="text-xs hover:opacity-80"
                          style={{ color: '#FF6B00' }}
                        >
                          Open portal
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Export Job" size="lg">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Select Existing Client (optional)</label>
              <select
                value={draft.clientId}
                onChange={(e) => handleClientPick(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Choose a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Source Channel</label>
              <select
                value={draft.sourceChannel}
                onChange={(e) => setDraft((p) => ({ ...p, sourceChannel: e.target.value as ExportJob['sourceChannel'] }))}
                className="input-field text-sm"
              >
                <option value="Website">Website</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referral">Referral</option>
                <option value="Direct">Direct</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Company Name *</label>
              <input value={draft.companyName} onChange={(e) => setDraft((p) => ({ ...p, companyName: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Contact Name *</label>
              <input value={draft.contactName} onChange={(e) => setDraft((p) => ({ ...p, contactName: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Email *</label>
              <input value={draft.email} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Phone *</label>
              <input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Destination Country *</label>
              <input value={draft.destinationCountry} onChange={(e) => setDraft((p) => ({ ...p, destinationCountry: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Vehicle Description *</label>
              <input value={draft.vehicleDescription} onChange={(e) => setDraft((p) => ({ ...p, vehicleDescription: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Project Value (ZAR) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.projectValue}
              onChange={(e) => setDraft((p) => ({ ...p, projectValue: e.target.value }))}
              className="input-field text-sm"
              placeholder="e.g. 52700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-muted mb-1">Estimated Departure</label>
              <input type="date" value={draft.estimatedDepartureDate} onChange={(e) => setDraft((p) => ({ ...p, estimatedDepartureDate: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs text-brand-muted mb-1">Estimated Arrival</label>
              <input type="date" value={draft.estimatedArrivalDate} onChange={(e) => setDraft((p) => ({ ...p, estimatedArrivalDate: e.target.value }))} className="input-field text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Notes</label>
            <textarea value={draft.notes} onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))} rows={3} className="input-field text-sm" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateJob}
              className="px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B00' }}
            >
              Create Job
            </button>
          </div>
        </div>
      </Modal>

      <div className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h3 className="text-sm text-brand-white font-head">Notification Feed</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-muted">Pending: {outboxPending} · Failed: {outboxFailed} · Sent: {outboxSent}</span>
              <button
                onClick={handleDispatchOutbox}
                disabled={dispatchingOutbox}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-brand-border text-xs text-brand-text enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
              >
                <Send size={12} />
                {dispatchingOutbox ? 'Dispatching...' : 'Dispatch Emails'}
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-brand-border">
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-brand-muted">No notifications yet.</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-card2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm text-brand-white font-medium truncate">{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full" style={{ background: '#FF6B00' }} />}
                  </div>
                  <p className="text-xs text-brand-text">{n.message}</p>
                  <p className="text-[11px] text-brand-muted mt-1">{formatDateShort(n.createdAt.split('T')[0])}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </PageBackground>
  );
}
