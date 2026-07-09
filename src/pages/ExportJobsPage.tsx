import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Ship, CheckCircle2, Circle, ArrowRight, Bell, Wallet, Send, Paperclip, Eye, EyeOff, Trash2, Download, Pencil, XCircle, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { EmptyState } from '../components/shared/EmptyState';
import { Modal } from '../components/shared/Modal';
import { useExportJobs } from '../hooks/useExportJobs';
import { useInvoices } from '../hooks/useInvoices';
import { useClients } from '../hooks/useClients';
import { useNotifications } from '../hooks/useNotifications';
import type { ExportJob, ExportJobPaymentMilestone, ExportJobStatus } from '../types/exportJob';
import type { NewInvoicePreFill } from './NewInvoicePage';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { formatDateShort, todayISO } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { documentVaultStorageService, isRemoteVaultEnabled } from '../services/documentVaultStorageService';

const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

function bytesLabel(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

const STATUS_LABELS: Record<ExportJobStatus, string> = {
  ENQUIRY: 'Enquiry',
  SOURCING: 'Sourcing',
  DOCUMENTATION: 'Documentation',
  SHIPPING: 'Shipping',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_BADGE: Record<ExportJobStatus, { fg: string; bg: string }> = {
  ENQUIRY: { fg: '#FBBF24', bg: 'rgba(251,191,36,0.16)' },
  SOURCING: { fg: '#60A5FA', bg: 'rgba(96,165,250,0.16)' },
  DOCUMENTATION: { fg: '#A78BFA', bg: 'rgba(167,139,250,0.18)' },
  SHIPPING: { fg: '#2DD4BF', bg: 'rgba(45,212,191,0.16)' },
  DELIVERED: { fg: '#22C55E', bg: 'rgba(34,197,94,0.16)' },
  CANCELLED: { fg: '#F87171', bg: 'rgba(248,113,113,0.16)' },
};

const TABS: Array<{ value: ExportJobStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'ENQUIRY', label: 'Enquiry' },
  { value: 'SOURCING', label: 'Sourcing' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'SHIPPING', label: 'Shipping' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
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
  const {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    cancelJob,
    advanceStatus,
    toggleDocument,
    togglePaymentMilestone,
    addVaultDocument,
    toggleVaultDocumentVisibility,
    deleteVaultDocument,
    runPaymentReminderCheck,
  } = useExportJobs();
  const { invoices } = useInvoices();
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

  const navigate = useNavigate();
  const [filter, setFilter] = useState<ExportJobStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null);
  const [deleteLinkedInvoicesCount, setDeleteLinkedInvoicesCount] = useState(0);
  const [editDraft, setEditDraft] = useState({
    destinationCountry: '',
    vehicleDescription: '',
    notes: '',
    projectValue: '',
    hasLinkedInvoices: false,
    milestones: [] as { key: string; label: string; amount: string; dueDate: string }[],
  });
  const [cancelReason, setCancelReason] = useState('');
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
    depositPercent: '30',
    shippingPercent: '40',
    balancePercent: '30',
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
    const depositPercent = Number(draft.depositPercent);
    const shippingPercent = Number(draft.shippingPercent);
    const balancePercent = Number(draft.balancePercent);
    const paymentPercentTotal = depositPercent + shippingPercent + balancePercent;

    if (!companyName || !contactName || !email || !phone || !destinationCountry || !vehicleDescription || !Number.isFinite(projectValue) || projectValue <= 0) {
      toast.error('Please complete all required fields');
      return;
    }

    if (![depositPercent, shippingPercent, balancePercent].every((value) => Number.isFinite(value) && value > 0)) {
      toast.error('Payment milestone percentages must be positive numbers');
      return;
    }

    if (Math.round(paymentPercentTotal * 100) / 100 !== 100) {
      toast.error('Payment milestone percentages must total 100%');
      return;
    }

    await addJob({
      clientId: draft.clientId || null,
      clientSnapshot: { companyName, contactName, email, phone },
      destinationCountry,
      vehicleDescription,
      sourceChannel: draft.sourceChannel,
      projectValue,
      depositPercent,
      shippingPercent,
      balancePercent,
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
      depositPercent: '30',
      shippingPercent: '40',
      balancePercent: '30',
      notes: '',
    });
  }

  function handleCreateInvoice(job: ExportJob, ms: ExportJobPaymentMilestone | null) {
    const milestoneSum = job.paymentMilestones.reduce((s, m) => s + m.amount, 0) || job.projectValue;
    const preFill: NewInvoicePreFill = {
      exportJobId: job.id,
      exportJobNumber: job.jobNumber,
      paymentMilestoneKey: ms ? ms.key : null,
      milestoneLabel: ms ? ms.label : `Entire Export Job — ${job.jobNumber}`,
      amount: ms ? ms.amount : milestoneSum,
      clientId: job.clientId,
      clientSnapshot: {
        companyName: job.clientSnapshot.companyName,
        contactName: job.clientSnapshot.contactName,
        email: job.clientSnapshot.email,
        phone: job.clientSnapshot.phone,
        address: '',
      },
      dueDate: ms ? ms.dueDate : job.estimatedArrivalDate,
    };
    navigate('/invoices/new', { state: { preFill } });
  }

  async function handleAdvanceStatus(jobId: string) {
    const updated = await advanceStatus(jobId);
    if (!updated) {
      toast.error('Could not update export stage');
      return;
    }
    toast.success(`Moved to ${STATUS_LABELS[updated.status]}`);
  }

  function handleQuickEdit(job: ExportJob) {
    if (!['ENQUIRY', 'SOURCING', 'DOCUMENTATION'].includes(job.status)) {
      toast.error('Core details can only be edited during Enquiry, Sourcing, or Documentation stages');
      return;
    }

    const linkedCount = invoices.filter((inv) => inv.exportJobId === job.id).length;
    setSelectedJob(job);
    setEditDraft({
      destinationCountry: job.destinationCountry,
      vehicleDescription: job.vehicleDescription,
      notes: job.notes,
      projectValue: String(job.projectValue),
      hasLinkedInvoices: linkedCount > 0,
      milestones: job.paymentMilestones.map((ms) => ({
        key: ms.key,
        label: ms.label,
        amount: String(ms.amount),
        dueDate: ms.dueDate,
      })),
    });
    setEditModalOpen(true);
  }

  async function handleEditSubmit() {
    if (!selectedJob) return;

    const destinationCountry = editDraft.destinationCountry.trim();
    const vehicleDescription = editDraft.vehicleDescription.trim();
    const notesInput = editDraft.notes;
    const newProjectValue = parseFloat(editDraft.projectValue);

    if (!destinationCountry || !vehicleDescription) {
      toast.error('Destination country and vehicle description are required');
      return;
    }

    if (!editDraft.hasLinkedInvoices) {
      if (!Number.isFinite(newProjectValue) || newProjectValue <= 0) {
        toast.error('Project value must be a positive number');
        return;
      }
    }

    const parsedMilestones = editDraft.milestones.map((ms) => ({
      ...ms,
      amount: parseFloat(ms.amount),
    }));

    if (parsedMilestones.some((ms) => !Number.isFinite(ms.amount) || ms.amount <= 0)) {
      toast.error('All milestone amounts must be positive numbers');
      return;
    }

    const effectiveTotal = editDraft.hasLinkedInvoices
      ? (selectedJob.paymentMilestones.reduce((s, ms) => s + ms.amount, 0) || selectedJob.projectValue)
      : newProjectValue;

    const milestoneTotal = parsedMilestones.reduce((s, ms) => s + ms.amount, 0);
    if (Math.abs(milestoneTotal - effectiveTotal) > 0.02) {
      toast.error(`Milestone amounts must total ${formatCurrency(effectiveTotal)} (currently ${formatCurrency(milestoneTotal)})`);
      return;
    }

    const updatedMilestones = parsedMilestones.map((ms, idx) => ({
      ...selectedJob.paymentMilestones[idx],
      amount: ms.amount,
      dueDate: ms.dueDate,
    }));

    const patch: Record<string, unknown> = {
      destinationCountry,
      vehicleDescription,
      notes: notesInput,
      paymentMilestones: updatedMilestones,
    };

    if (!editDraft.hasLinkedInvoices && newProjectValue !== selectedJob.projectValue) {
      patch.projectValue = newProjectValue;
    }

    await updateJob(selectedJob.id, patch as Parameters<typeof updateJob>[1]);

    toast.success('Export job updated');
    setEditModalOpen(false);
    setSelectedJob(null);
  }

  function handleCancelJob(job: ExportJob) {
    if (job.status === 'DELIVERED' || job.status === 'CANCELLED') {
      toast.error('Delivered or already cancelled jobs cannot be cancelled');
      return;
    }

    setSelectedJob(job);
    setCancelReason(job.cancellationReason ?? '');
    setCancelModalOpen(true);
  }

  async function handleCancelSubmit() {
    if (!selectedJob) return;

    const reason = cancelReason.trim();
    if (!reason) {
      toast.error('Cancellation reason is required');
      return;
    }

    await cancelJob(selectedJob.id, reason);
    toast.success('Export job cancelled');
    setCancelModalOpen(false);
    setSelectedJob(null);
    setCancelReason('');
  }

  function handleDeleteJob(job: ExportJob, linkedInvoicesCount: number) {
    if (job.status !== 'ENQUIRY') {
      toast.error('Only ENQUIRY jobs can be deleted');
      return;
    }

    if (linkedInvoicesCount > 0) {
      toast.error('Cannot delete jobs with linked invoices');
      return;
    }

    setSelectedJob(job);
    setDeleteLinkedInvoicesCount(linkedInvoicesCount);
    setDeleteModalOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!selectedJob) {
      return;
    }

    if (deleteLinkedInvoicesCount > 0) {
      toast.error('Cannot delete jobs with linked invoices');
      return;
    }

    await deleteJob(selectedJob.id);
    toast.success('Export job deleted');
    setDeleteModalOpen(false);
    setSelectedJob(null);
    setDeleteLinkedInvoicesCount(0);
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

  async function handleUploadVaultDocument(jobId: string, file: File | null, category: 'Compliance' | 'Shipping' | 'Customs' | 'Payment' | 'General') {
    if (!file) return;
    if (!isRemoteVaultEnabled && file.size > MAX_UPLOAD_BYTES) {
      toast.error('File too large. Maximum size is 3 MB for this local vault mode.');
      return;
    }

    let updated = null;
    try {
      updated = await addVaultDocument(jobId, {
        file,
        category,
        visibleToClient: false,
      });
    } catch (error) {
      toast.error(`Upload failed: ${String(error)}`);
      return;
    }

    if (!updated) {
      toast.error('Failed to save document');
      return;
    }

    toast.success('Document uploaded to vault');
  }

  async function handleToggleVaultVisibility(jobId: string, docId: string) {
    const updated = await toggleVaultDocumentVisibility(jobId, docId);
    if (!updated) {
      toast.error('Could not update visibility');
      return;
    }
    toast.success('Document visibility updated');
  }

  async function handleDeleteVaultDocument(jobId: string, docId: string) {
    const updated = await deleteVaultDocument(jobId, docId);
    if (!updated) {
      toast.error('Could not delete document');
      return;
    }
    toast.success('Document removed');
  }

  async function handleDownloadVaultDocument(doc: ExportJob['vaultDocuments'][number]) {
    const url = await documentVaultStorageService.resolveDownloadUrl(doc);
    if (!url) {
      toast.error('Download link is not available for this document');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.name;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
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
                const isTerminal = job.status === 'DELIVERED' || job.status === 'CANCELLED';
                const canAdvance = !isTerminal;
                const canEditCore = ['ENQUIRY', 'SOURCING', 'DOCUMENTATION'].includes(job.status);
                const canCancel = !isTerminal;
                const linkedInvoices = invoices.filter((invoice) => invoice.exportJobId === job.id);
                const canDelete = job.status === 'ENQUIRY' && linkedInvoices.length === 0;
                const linkedGrossTotal = linkedInvoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
                const linkedDiscountTotal = linkedInvoices.reduce((sum, invoice) => sum + invoice.discountAmount, 0);
                const linkedNetTotal = linkedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
                const linkedPaidTotal = linkedInvoices
                  .filter((invoice) => invoice.status === 'PAID')
                  .reduce((sum, invoice) => sum + invoice.total, 0);
                const linkedOutstandingTotal = Math.max(linkedNetTotal - linkedPaidTotal, 0);

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
                      {job.cancellationReason ? (
                        <p className="text-[11px] text-red-300 mt-2">Cancellation reason: {job.cancellationReason}</p>
                      ) : null}
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
                              disabled={isTerminal}
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
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-brand-muted">Invoicing Breakdown</p>
                          <button
                            onClick={() => handleCreateInvoice(job, null)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md border border-brand-border text-[11px] text-brand-text hover:bg-brand-card2 transition-colors"
                          >
                            <FilePlus size={11} />
                            Invoice entire job
                          </button>
                        </div>
                        {linkedInvoices.length === 0 ? (
                          <p className="text-[11px] text-brand-muted">No linked invoices yet. Link invoices to this export job for accurate cost tracking.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="px-2.5 py-2 rounded-md border border-brand-border">
                              <p className="text-[11px] text-brand-muted">Invoices Linked</p>
                              <p className="text-xs font-head text-brand-white">{linkedInvoices.length}</p>
                            </div>
                            <div className="px-2.5 py-2 rounded-md border border-brand-border">
                              <p className="text-[11px] text-brand-muted">Gross Invoiced</p>
                              <p className="text-xs font-head text-brand-white">{formatCurrency(linkedGrossTotal)}</p>
                            </div>
                            <div className="px-2.5 py-2 rounded-md border border-brand-border">
                              <p className="text-[11px] text-brand-muted">Net Due</p>
                              <p className="text-xs font-head text-brand-white">{formatCurrency(linkedNetTotal)}</p>
                            </div>
                            <div className="px-2.5 py-2 rounded-md border border-brand-border">
                              <p className="text-[11px] text-brand-muted">Discounts Given</p>
                              <p className="text-xs font-head text-brand-white">{formatCurrency(linkedDiscountTotal)}</p>
                            </div>
                            <div className="px-2.5 py-2 rounded-md border border-brand-border sm:col-span-2">
                              <p className="text-[11px] text-brand-muted">Outstanding Net Due</p>
                              <p className="text-xs font-head text-brand-white">{formatCurrency(linkedOutstandingTotal)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-xs text-brand-muted mb-2">Payment Milestones</p>
                        <div className="space-y-1.5">
                          {job.paymentMilestones.map((ms) => (
                            <div key={ms.key} className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleTogglePayment(job.id, ms.key)}
                                disabled={isTerminal}
                                className="flex-1 flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border border-brand-border text-left hover:bg-brand-card2 transition-colors"
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
                              <button
                                onClick={() => handleCreateInvoice(job, ms)}
                                title={`Create invoice for ${ms.label}`}
                                className="flex-shrink-0 p-1.5 rounded-md border border-brand-border text-brand-muted hover:text-brand-white hover:bg-brand-card2 transition-colors"
                              >
                                <FilePlus size={13} />
                              </button>
                            </div>
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
                        <button
                          onClick={() => handleQuickEdit(job)}
                          disabled={!canEditCore}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-border text-brand-text enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
                        >
                          Edit
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleCancelJob(job)}
                          disabled={!canCancel}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-border text-red-300 enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
                        >
                          Cancel Job
                          <XCircle size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job, linkedInvoices.length)}
                          disabled={!canDelete}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-border text-red-300 enabled:hover:bg-brand-card2 disabled:opacity-40 transition-colors"
                        >
                          Delete
                          <Trash2 size={13} />
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

                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <p className="text-xs text-brand-muted">Document Vault</p>
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue="Compliance"
                              className="input-field text-xs py-1.5 px-2.5 w-[120px]"
                              id={`vault-category-${job.id}`}
                            >
                              <option value="Compliance">Compliance</option>
                              <option value="Shipping">Shipping</option>
                              <option value="Customs">Customs</option>
                              <option value="Payment">Payment</option>
                              <option value="General">General</option>
                            </select>
                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-brand-border text-xs text-brand-text hover:bg-brand-card2 transition-colors cursor-pointer">
                              <Paperclip size={12} />
                              Upload
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  const categorySelect = document.getElementById(`vault-category-${job.id}`) as HTMLSelectElement | null;
                                  const category = (categorySelect?.value as 'Compliance' | 'Shipping' | 'Customs' | 'Payment' | 'General') || 'Compliance';
                                  await handleUploadVaultDocument(job.id, file, category);
                                  e.currentTarget.value = '';
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {job.vaultDocuments.length === 0 ? (
                          <p className="text-[11px] text-brand-muted">No files uploaded yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {job.vaultDocuments.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border border-brand-border">
                                <div className="min-w-0">
                                  <p className="text-xs text-brand-text truncate">{doc.name}</p>
                                  <p className="text-[11px] text-brand-muted">
                                    {doc.category} · {bytesLabel(doc.sizeBytes)} · {formatDateShort(doc.uploadedAt.split('T')[0])}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleVaultVisibility(job.id, doc.id)}
                                    className="p-1.5 rounded-md border border-brand-border hover:bg-brand-card2 transition-colors"
                                    title={doc.visibleToClient ? 'Visible to client' : 'Hidden from client'}
                                  >
                                    {doc.visibleToClient ? <Eye size={12} /> : <EyeOff size={12} className="text-brand-muted" />}
                                  </button>
                                  <button
                                    onClick={() => handleDownloadVaultDocument(doc)}
                                    className="p-1.5 rounded-md border border-brand-border hover:bg-brand-card2 transition-colors"
                                    title="Download"
                                  >
                                    <Download size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVaultDocument(job.id, doc.id)}
                                    className="p-1.5 rounded-md border border-brand-border hover:bg-brand-card2 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} className="text-red-300" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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

          <div className="rounded-xl border border-brand-border p-3 space-y-3">
            <div>
              <p className="text-xs text-brand-muted mb-1">Payment Milestone Split (%)</p>
              <p className="text-[11px] text-brand-muted">Defaults to 30 / 40 / 30 and must total 100.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-brand-muted mb-1">Deposit</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.depositPercent}
                  onChange={(e) => setDraft((p) => ({ ...p, depositPercent: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Shipping</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.shippingPercent}
                  onChange={(e) => setDraft((p) => ({ ...p, shippingPercent: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-muted mb-1">Balance</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.balancePercent}
                  onChange={(e) => setDraft((p) => ({ ...p, balancePercent: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>
            </div>
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

      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedJob(null);
        }}
        title={selectedJob ? `Edit ${selectedJob.jobNumber}` : 'Edit Export Job'}
        size="md"
      >
        <div className="space-y-3">
          {/* Project value — editable only when no invoices are linked */}
          <div>
            <label className="block text-xs text-brand-muted mb-1">
              Project Value (R)
              {editDraft.hasLinkedInvoices && (
                <span className="ml-2 text-[10px] text-amber-400">locked — invoices already linked</span>
              )}
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              readOnly={editDraft.hasLinkedInvoices}
              value={editDraft.projectValue}
              onChange={(e) => {
                const raw = e.target.value;
                const newVal = parseFloat(raw);
                setEditDraft((prev) => {
                  if (!Number.isFinite(newVal) || newVal <= 0 || prev.milestones.length === 0) {
                    return { ...prev, projectValue: raw };
                  }
                  // Derive existing split ratios from current milestone amounts
                  const currentTotal = prev.milestones.reduce((s, ms) => s + (parseFloat(ms.amount) || 0), 0);
                  const recalculated = prev.milestones.map((ms, idx) => {
                    const ratio = currentTotal > 0 ? (parseFloat(ms.amount) || 0) / currentTotal : 1 / prev.milestones.length;
                    const isLast = idx === prev.milestones.length - 1;
                    if (isLast) {
                      // assign remainder to avoid floating point drift
                      const allocated = prev.milestones
                        .slice(0, -1)
                        .reduce((s, m) => {
                          const r = currentTotal > 0 ? (parseFloat(m.amount) || 0) / currentTotal : 1 / prev.milestones.length;
                          return s + Math.round(newVal * r * 100) / 100;
                        }, 0);
                      return { ...ms, amount: String(Math.round((newVal - allocated) * 100) / 100) };
                    }
                    return { ...ms, amount: String(Math.round(newVal * ratio * 100) / 100) };
                  });
                  return { ...prev, projectValue: raw, milestones: recalculated };
                });
              }}
              className={`input-field text-sm text-right ${editDraft.hasLinkedInvoices ? 'read-only:opacity-60' : ''}`}
            />
          </div>

          <div>
            <label className="block text-xs text-brand-muted mb-1">Destination Country *</label>
            <input
              value={editDraft.destinationCountry}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, destinationCountry: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Vehicle Description *</label>
            <input
              value={editDraft.vehicleDescription}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, vehicleDescription: e.target.value }))}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Internal Notes</label>
            <textarea
              rows={3}
              value={editDraft.notes}
              onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field text-sm"
            />
          </div>

          {editDraft.milestones.length > 0 && (
            <div>
              <label className="block text-xs text-brand-muted mb-2">Payment Milestones</label>
              <div className="space-y-2">
                {editDraft.milestones.map((ms, idx) => (
                  <div key={ms.key} className="rounded-lg border border-brand-border p-3 space-y-2">
                    <p className="text-xs font-head text-brand-white">{ms.label}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-brand-muted mb-1">Amount (R)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ms.amount}
                          onChange={(e) => setEditDraft((prev) => ({
                            ...prev,
                            milestones: prev.milestones.map((m, i) => i === idx ? { ...m, amount: e.target.value } : m),
                          }))}
                          className="input-field text-sm text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-brand-muted mb-1">Due Date</label>
                        <input
                          type="date"
                          value={ms.dueDate}
                          onChange={(e) => setEditDraft((prev) => ({
                            ...prev,
                            milestones: prev.milestones.map((m, i) => i === idx ? { ...m, dueDate: e.target.value } : m),
                          }))}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-brand-muted mt-1.5">
                Total: {formatCurrency(editDraft.milestones.reduce((s, ms) => s + (parseFloat(ms.amount) || 0), 0))}
                {selectedJob && ` / ${formatCurrency(
                  editDraft.hasLinkedInvoices
                    ? (selectedJob.paymentMilestones.reduce((s, ms) => s + ms.amount, 0) || selectedJob.projectValue)
                    : (parseFloat(editDraft.projectValue) || selectedJob.projectValue)
                )}`}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedJob(null);
              }}
              className="px-3 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card2 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleEditSubmit}
              className="px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: '#FF6B00' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedJob(null);
          setCancelReason('');
        }}
        title={selectedJob ? `Cancel ${selectedJob.jobNumber}` : 'Cancel Export Job'}
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-brand-text">Provide a clear cancellation reason. This will be visible in the job history.</p>
          <div>
            <label className="block text-xs text-brand-muted mb-1">Cancellation Reason *</label>
            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-field text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedJob(null);
                setCancelReason('');
              }}
              className="px-3 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card2 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleCancelSubmit}
              className="px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: '#DC2626' }}
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedJob(null);
          setDeleteLinkedInvoicesCount(0);
        }}
        title={selectedJob ? `Delete ${selectedJob.jobNumber}` : 'Delete Export Job'}
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm text-brand-text">This action is permanent and cannot be undone.</p>
          <div className="rounded-lg border border-brand-border p-3 text-xs text-brand-muted">
            Status must be ENQUIRY and linked invoices must be 0.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedJob(null);
                setDeleteLinkedInvoicesCount(0);
              }}
              className="px-3 py-2 rounded-lg border border-brand-border text-sm text-brand-text hover:bg-brand-card2 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-2 rounded-lg text-sm text-white hover:opacity-90 transition-opacity"
              style={{ background: '#DC2626' }}
            >
              Delete Job
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
