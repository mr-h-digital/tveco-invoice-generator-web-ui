import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { toast } from 'sonner';
import { Pencil, Copy, Trash2, Printer, ArrowLeft, MoreVertical, FileText } from 'lucide-react';
import { QuotePreview } from '../components/quote/QuotePreview';
import { QuotePrintLayout } from '../components/quote/QuotePrintLayout';
import { Badge } from '../components/shared/Badge';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useQuotes, useQuote } from '../hooks/useQuotes';
import { useInvoices } from '../hooks/useInvoices';
import { usePrint } from '../hooks/usePrint';
import { invoiceService } from '../services/invoiceService';
import { todayISO, addDaysISO } from '../utils/formatDate';
import type { QuoteStatus } from '../types/quote';
import { calculateTotals } from '../utils/invoiceTotals';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateQuote, deleteQuote, duplicateQuote } = useQuotes();
  const { addInvoice } = useInvoices();
  const quote = useQuote(id);
  const { print } = usePrint();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!quote) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-brand-muted">Quote not found</p>
        <Link to="/quotes" className="text-sm hover:underline" style={{ color: '#FF6B00' }}>Back to quotes</Link>
      </div>
    );
  }

  async function handleStatusChange(status: QuoteStatus) {
    if (!id) return;
    try {
      await updateQuote(id, { status });
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function handleDuplicate() {
    if (!id) return;
    try {
      const dup = await duplicateQuote(id);
      toast.success(`Duplicated as ${dup.quoteNumber}`);
      navigate(`/quotes/${dup.id}/edit`);
    } catch {
      toast.error('Failed to duplicate');
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteQuote(id);
      toast.success('Quote deleted');
      navigate('/quotes');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleConvertToInvoice() {
    if (!quote) return;

    try {
      const invoiceNumber = await invoiceService.getNextInvoiceNumber();
      const issueDate = todayISO();
      const dueDate = addDaysISO(issueDate, 14);
      const totals = calculateTotals({
        lineItems: quote.lineItems,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        vatEnabled: quote.vatEnabled,
        vatRate: quote.vatRate,
      });

      const invoice = await addInvoice({
        invoiceNumber,
        status: 'DRAFT',
        issueDate,
        dueDate,
        clientId: quote.clientId,
        exportJobId: null,
        paymentMilestoneKey: null,
        clientSnapshot: quote.clientSnapshot,
        lineItems: quote.lineItems,
        subtotal: totals.subtotal,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        discountAmount: totals.discountAmount,
        vatEnabled: quote.vatEnabled,
        vatRate: quote.vatRate,
        vatAmount: totals.vatAmount,
        total: totals.total,
        notes: `${quote.notes}\n\nConverted from quote ${quote.quoteNumber}.`,
        paymentDetails: {
          bank: 'First National Bank (FNB)',
          accountName: 'T S Concepts and Projects Enterprises (Pty) Ltd',
          accountNumber: '63166663849',
          accountType: 'Gold Business Account',
          branchCode: '200609',
          reference: invoiceNumber,
        },
      });

      toast.success(`Converted to invoice ${invoice.invoiceNumber}`);
      navigate(`/invoices/${invoice.id}/edit`);
    } catch {
      toast.error('Failed to convert quote to invoice');
    }
  }

  return (
    <PageBackground image={invoicesBg} position="center 25%">
      <TopBar
        title={quote.quoteNumber}
        subtitle={quote.clientSnapshot.companyName}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Badge status={quote.status} />

            <div className="hidden md:flex items-center gap-2">
              <select value={quote.status} onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
                className="bg-brand-card border border-brand-border text-brand-text text-xs rounded-lg px-2 py-1.5" aria-label="Change status">
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button onClick={print} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card border border-brand-border text-brand-text rounded-lg hover:bg-brand-card2 transition-colors">
                <Printer size={13} /> Print / PDF
              </button>
              <button onClick={handleConvertToInvoice} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card border border-brand-border text-brand-text rounded-lg hover:bg-brand-card2 transition-colors">
                <FileText size={13} /> Convert to Invoice
              </button>
              <button onClick={handleDuplicate} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card border border-brand-border text-brand-text rounded-lg hover:bg-brand-card2 transition-colors">
                <Copy size={13} /> Duplicate
              </button>
              <Link to={`/quotes/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand-card2 border border-brand-border text-brand-text rounded-lg hover:bg-brand-border transition-colors">
                <Pencil size={13} /> Edit
              </Link>
              <button onClick={() => setConfirmDelete(true)} aria-label="Delete quote" className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-brand-card border border-brand-border transition-colors">
                <Trash2 size={15} />
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <Link to={`/quotes/${id}/edit`} className="flex items-center gap-1.5 px-3 py-2 text-xs text-white rounded-lg font-medium" style={{ background: '#FF6B00' }}>
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
                      <button onClick={() => { print(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text w-full text-left hover:bg-brand-border transition-colors">
                        <Printer size={14} /> Print / PDF
                      </button>
                      <button onClick={() => { handleConvertToInvoice(); setMobileMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text w-full text-left hover:bg-brand-border transition-colors">
                        <FileText size={14} /> Convert to Invoice
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
        <Link to="/quotes" className="flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6 print:hidden">
          <ArrowLeft size={14} /> Back to quotes
        </Link>

        <div className="print:hidden">
          <QuotePreview quote={quote} />
        </div>
        <div className="hidden print:block">
          <QuotePrintLayout quote={quote} />
        </div>
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        title="Delete Quote" description={`Delete ${quote.quoteNumber}? This cannot be undone.`}
        confirmLabel="Delete" loading={deleting} />
    </PageBackground>
  );
}
