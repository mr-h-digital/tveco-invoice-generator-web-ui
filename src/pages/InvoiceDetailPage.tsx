import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { toast } from 'sonner';
import { Pencil, Copy, CheckCircle, Trash2, Printer, ArrowLeft, MoreVertical } from 'lucide-react';
import { InvoicePreview } from '../components/invoice/InvoicePreview';
import { InvoicePrintLayout } from '../components/invoice/InvoicePrintLayout';
import { Badge } from '../components/shared/Badge';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useInvoices, useInvoice } from '../hooks/useInvoices';
import { usePrint } from '../hooks/usePrint';
import type { InvoiceStatus } from '../types/invoice';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateInvoice, deleteInvoice, duplicateInvoice } = useInvoices();
  const invoice = useInvoice(id);
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!invoice) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-brand-muted">Invoice not found</p>
        <Link to="/invoices" className="text-sm hover:underline" style={{ color: '#FF6B00' }}>Back to invoices</Link>
      </div>
    );
  }

  async function handleStatusChange(status: InvoiceStatus) {
    if (!id) return;
    try { await updateInvoice(id, { status }); toast.success(`Marked as ${status}`); }
    catch { toast.error('Failed to update status'); }
  }

  async function handleDuplicate() {
    if (!id) return;
    try {
      const dup = await duplicateInvoice(id);
      toast.success(`Duplicated as ${dup.invoiceNumber}`);
      navigate(`/invoices/${dup.id}/edit`);
    } catch { toast.error('Failed to duplicate'); }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try { await deleteInvoice(id); toast.success('Invoice deleted'); navigate('/invoices'); }
    catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); setConfirmDelete(false); }
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={invoice.clientSnapshot.companyName}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Badge status={invoice.status} />

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              {invoice.status !== 'PAID' && (
                <button onClick={() => handleStatusChange('PAID')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors" style={{ background: 'rgba(255,107,0,0.1)', color: '#FF6B00', borderColor: 'rgba(255,107,0,0.25)' }}>
                  <CheckCircle size={13} /> Mark Paid
                </button>
              )}
              <select value={invoice.status} onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
                className="bg-brand-card border border-brand-border text-brand-text text-xs rounded-lg px-2 py-1.5" aria-label="Change status">
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <button onClick={print} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card border border-brand-border text-brand-text rounded-lg hover:bg-brand-card2 transition-colors">
                <Printer size={13} /> Print / PDF
              </button>
              <button onClick={handleDuplicate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card border border-brand-border text-brand-text rounded-lg hover:bg-brand-card2 transition-colors">
                <Copy size={13} /> Duplicate
              </button>
              <Link to={`/invoices/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card2 border border-brand-border text-brand-text rounded-lg hover:bg-brand-border transition-colors">
                <Pencil size={13} /> Edit
              </Link>
              <button onClick={() => setConfirmDelete(true)} aria-label="Delete invoice" className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-brand-card border border-brand-border transition-colors">
                <Trash2 size={15} />
              </button>
            </div>

            {/* Mobile */}
            <div className="flex md:hidden items-center gap-2">
              <Link to={`/invoices/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 text-xs text-white rounded-lg font-medium" style={{ background: '#FF6B00' }}>
                <Pencil size={13} /> Edit
              </Link>
              <div className="relative">
                <button onClick={() => setMobileMenuOpen((v) => !v)} aria-label="More actions" className="p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card border border-brand-border transition-colors">
                  <MoreVertical size={16} />
                </button>
                {mobileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-brand-card2 border border-brand-border rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                      {invoice.status !== 'PAID' && (
                        <button onClick={() => { handleStatusChange('PAID'); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm w-full text-left hover:bg-brand-border transition-colors" style={{ color: '#FF6B00' }}>
                          <CheckCircle size={14} /> Mark Paid
                        </button>
                      )}
                      <button onClick={() => { print(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text w-full text-left hover:bg-brand-border transition-colors">
                        <Printer size={14} /> Print / PDF
                      </button>
                      <button onClick={() => { handleDuplicate(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text w-full text-left hover:bg-brand-border transition-colors">
                        <Copy size={14} /> Duplicate
                      </button>
                      <hr className="border-brand-border my-1" />
                      <button onClick={() => { setMobileMenuOpen(false); setConfirmDelete(true); }} className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 w-full text-left hover:bg-brand-border transition-colors">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        }
      />

      <div className="invoice-detail-page-wrapper p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <Link to="/invoices" className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6 print:hidden">
          <ArrowLeft size={14} /> Back to invoices
        </Link>

        <div className="print:hidden">
          <InvoicePreview invoice={invoice} />
        </div>
        <div className="hidden print:block">
          <InvoicePrintLayout invoice={invoice} />
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        title="Delete Invoice" description={`Delete ${invoice.invoiceNumber}? This cannot be undone.`}
        confirmLabel="Delete" loading={deleting} />
    </PageBackground>
  );
}
