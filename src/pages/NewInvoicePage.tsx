import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useWatch, FormProvider, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { invoiceFormSchema, type InvoiceFormValues } from '../schemas/invoiceSchema';
import { InvoiceForm } from '../components/invoice/InvoiceForm';
import { InvoicePreview } from '../components/invoice/InvoicePreview';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useInvoices } from '../hooks/useInvoices';
import { invoiceService } from '../services/invoiceService';
import { calculateTotals } from '../utils/invoiceTotals';
import { todayISO, addDaysISO } from '../utils/formatDate';
import { v4 as uuid } from 'uuid';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';

export function NewInvoicePage() {
  const navigate = useNavigate();
  const { addInvoice } = useInvoices();
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const today = todayISO();

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as Resolver<InvoiceFormValues>,
    defaultValues: {
      invoiceNumber: `TVECO-${today.slice(0, 4)}-???`,
      status: 'DRAFT',
      issueDate: today,
      dueDate: addDaysISO(today, 14),
      clientId: null,
      clientSnapshot: { companyName: '', contactName: '', email: '', phone: '', address: '' },
      lineItems: [{ id: uuid(), name: '', description: '', quantity: 1, unitPrice: 0, amount: 0, sortOrder: 0 }],
      discountType: null,
      discountValue: 0,
      vatEnabled: false,
      vatRate: 0.15,
      notes: 'Payment due within 14 days. EFT preferred. Please use your invoice number as payment reference. Proof of payment to enquiries@tveco.co.za.',
      paymentDetails: {
        bank: 'First National Bank (FNB)',
        accountName: 'T S Concepts and Projects Enterprises (Pty) Ltd',
        accountNumber: '63166663849',
        accountType: 'Gold Business Account',
        branchCode: '200609',
        reference: '',
      },
    },
  });

  useEffect(() => {
    invoiceService.getNextInvoiceNumber().then((number) => {
      methods.setValue('invoiceNumber', number);
      methods.setValue('paymentDetails.reference', number);
    }).catch(() => {});
  }, [methods]);

  const [invoiceNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, clientSnapshot, issueDate, dueDate, status, notes, paymentDetails] = useWatch({
    control: methods.control,
    name: ['invoiceNumber', 'lineItems', 'discountType', 'discountValue', 'vatEnabled', 'vatRate', 'clientId', 'clientSnapshot', 'issueDate', 'dueDate', 'status', 'notes', 'paymentDetails'],
  });

  const totals = calculateTotals({
    lineItems: lineItems ?? [],
    discountType: discountType ?? null,
    discountValue: discountValue ?? 0,
    vatEnabled: vatEnabled ?? false,
    vatRate: vatRate ?? 0.15,
  });

  const previewValues = { invoiceNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, clientSnapshot, issueDate, dueDate, status, notes, paymentDetails };

  const onSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
    const computed = calculateTotals({
      lineItems: data.lineItems,
      discountType: data.discountType,
      discountValue: data.discountValue,
      vatEnabled: data.vatEnabled,
      vatRate: data.vatRate,
    });
    try {
      const invoice = await addInvoice({ ...data, ...computed } as never);
      toast.success(`Invoice ${data.invoiceNumber} created`);
      navigate(`/invoices/${invoice.id}`);
    } catch {
      toast.error('Failed to create invoice');
    }
  };

  return (
    <FormProvider {...methods}>
      <PageBackground image={invoicesBg} position="center 25%">
        <TopBar
          title="New Invoice"
          subtitle={invoiceNumber}
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
              <Link to="/invoices" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border text-brand-muted text-sm hover:text-brand-text hover:bg-brand-card2 transition-colors">
                <X size={15} /><span className="hidden sm:inline">Cancel</span>
              </Link>
              <button onClick={methods.handleSubmit(onSubmit)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
                <Save size={15} /><span className="hidden sm:inline">Save Invoice</span><span className="sm:hidden">Save</span>
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
