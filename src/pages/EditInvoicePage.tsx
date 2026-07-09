import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch, FormProvider, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { invoiceFormSchema, type InvoiceFormValues } from '../schemas/invoiceSchema';
import { InvoiceForm } from '../components/invoice/InvoiceForm';
import { InvoicePreview } from '../components/invoice/InvoicePreview';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useInvoices, useInvoice } from '../hooks/useInvoices';
import { calculateTotals } from '../utils/invoiceTotals';

export function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateInvoice, loading } = useInvoices();
  const invoice = useInvoice(id);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as Resolver<InvoiceFormValues>,
  });

  useEffect(() => {
    if (invoice) {
      methods.reset({
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        clientId: invoice.clientId,
        exportJobId: invoice.exportJobId,
        paymentMilestoneKey: invoice.paymentMilestoneKey,
        clientSnapshot: invoice.clientSnapshot,
        lineItems: invoice.lineItems,
        discountType: invoice.discountType,
        discountValue: invoice.discountValue,
        vatEnabled: invoice.vatEnabled,
        vatRate: invoice.vatRate,
        notes: invoice.notes,
        paymentDetails: invoice.paymentDetails,
      });
    }
  }, [invoice, methods]);

  const [invoiceNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, exportJobId, paymentMilestoneKey, clientSnapshot, issueDate, dueDate, status, notes, paymentDetails] = useWatch({
    control: methods.control,
    name: ['invoiceNumber', 'lineItems', 'discountType', 'discountValue', 'vatEnabled', 'vatRate', 'clientId', 'exportJobId', 'paymentMilestoneKey', 'clientSnapshot', 'issueDate', 'dueDate', 'status', 'notes', 'paymentDetails'],
  });

  const totals = calculateTotals({
    lineItems: lineItems ?? [],
    discountType: discountType ?? null,
    discountValue: discountValue ?? 0,
    vatEnabled: vatEnabled ?? false,
    vatRate: vatRate ?? 0.15,
  });
  const previewValues = { invoiceNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, exportJobId, paymentMilestoneKey, clientSnapshot, issueDate, dueDate, status, notes, paymentDetails };

  const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
    if (!id) return;
    const computed = calculateTotals({ lineItems: data.lineItems, discountType: data.discountType, discountValue: data.discountValue, vatEnabled: data.vatEnabled, vatRate: data.vatRate });
    try {
      await updateInvoice(id, { ...data, ...computed } as never);
      toast.success('Invoice updated');
      navigate(`/invoices/${id}`);
    } catch { toast.error('Failed to update invoice'); }
  };

  if (!invoice && !loading) {
    return <div className="flex-1 flex items-center justify-center text-brand-muted">Invoice not found.</div>;
  }

  return (
    <FormProvider {...methods}>
      <PageBackground image={invoicesBg} position="center 25%">
        <TopBar
          title="Edit Invoice"
          subtitle={invoice?.invoiceNumber}
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex lg:hidden bg-brand-card border border-brand-border rounded-lg p-0.5 gap-0.5">
                {(['form', 'preview'] as const).map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className="px-2.5 py-1.5 rounded-md text-xs capitalize transition-colors"
                    style={activeTab === tab ? { background: '#FF6B00', color: '#fff', fontWeight: 500 } : { color: '#8A99AE' }}>
                    {tab}
                  </button>
                ))}
              </div>
              <button onClick={methods.handleSubmit(onSubmit)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
                <Save size={15} /><span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span>
              </button>
            </div>
          }
        />

        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:max-w-xl xl:max-w-2xl ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
            <InvoiceForm />
          </div>
          <div className={`flex-1 bg-brand-dark/60 border-l border-brand-border overflow-y-auto p-4 sm:p-6 ${activeTab === 'form' ? 'hidden lg:block' : ''}`}>
            <p className="text-xs font-head text-brand-muted uppercase tracking-wider mb-3">Live Preview</p>
            <InvoicePreview invoice={{ ...previewValues, ...totals } as never} />
          </div>
        </div>
      </PageBackground>
    </FormProvider>
  );
}
