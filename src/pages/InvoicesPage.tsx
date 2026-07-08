import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useInvoices } from '../hooks/useInvoices';
import { InvoiceCard } from '../components/invoice/InvoiceCard';
import { EmptyState } from '../components/shared/EmptyState';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import type { InvoiceStatus } from '../types/invoice';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';

const TABS: { label: string; value: InvoiceStatus | 'all' }[] = [
  { label: 'All', value: 'all' }, { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' }, { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
];

export function InvoicesPage() {
  const navigate = useNavigate();
  const { invoices, loading, deleteInvoice, duplicateInvoice } = useInvoices();
  const [filter, setFilter]           = useState<InvoiceStatus | 'all'>('all');
  const [search, setSearch]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting]       = useState(false);

  const filtered = invoices
    .filter((inv) => filter === 'all' || inv.status === filter)
    .filter((inv) =>
      !search ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientSnapshot.companyName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleDuplicate(id: string) {
    try {
      const dup = await duplicateInvoice(id);
      toast.success(`Duplicated as ${dup.invoiceNumber}`);
      navigate(`/invoices/${dup.id}/edit`);
    } catch { toast.error('Failed to duplicate invoice'); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteInvoice(deleteTarget);
      toast.success('Invoice deleted');
    } catch { toast.error('Failed to delete invoice'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar
        title="Invoices"
        subtitle={`${invoices.length} total`}
        actions={
          <Link data-tour-id="invoices-new-button" to="/invoices/new" className="flex items-center gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
            <Plus size={16} />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </Link>
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
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…" className="input-field pl-9 text-sm" />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3].map((n) => (
              <div key={n} className="bg-brand-card border border-brand-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-brand-border rounded w-1/3 mb-3" />
                <div className="h-5 bg-brand-border rounded w-2/3 mb-2" />
                <div className="h-3 bg-brand-border rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={search || filter !== 'all' ? 'No matching invoices' : 'No invoices yet'}
            description={search || filter !== 'all' ? 'Try a different search or filter.' : 'Create your first invoice to get started.'}
            action={!search && filter === 'all' ? (
              <Link to="/invoices/new" className="px-4 py-2.5 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
                Create Invoice
              </Link>
            ) : undefined}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((invoice, i) => (
                <motion.div key={invoice.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                  <InvoiceCard invoice={invoice} onDuplicate={handleDuplicate} onDelete={setDeleteTarget} />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Invoice" description="This action cannot be undone. The invoice will be permanently removed."
        confirmLabel="Delete" loading={deleting} />
    </PageBackground>
  );
}
