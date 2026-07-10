import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, useWatch, FormProvider, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { quoteFormSchema, type QuoteFormValues } from '../schemas/quoteSchema';
import { QuoteForm } from '../components/quote/QuoteForm';
import { QuotePreview } from '../components/quote/QuotePreview';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useQuotes } from '../hooks/useQuotes';
import { quoteService } from '../services/quoteService';
import { calculateTotals } from '../utils/invoiceTotals';
import { todayISO, addDaysISO } from '../utils/formatDate';
import { v4 as uuid } from 'uuid';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';

export function NewQuotePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addQuote } = useQuotes();
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const fromInquiry = (location.state as {
    fromInquiry?: {
      inquiryId: string;
      clientId: string;
      destinationCountry: string;
      vehicleDescription: string;
      notes: string;
      projectValue: number | null;
    };
  } | null)?.fromInquiry;

  const today = todayISO();

  const methods = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as Resolver<QuoteFormValues>,
    defaultValues: {
      quoteNumber: `QUO-${today.slice(0, 4)}-???`,
      status: 'DRAFT',
      issueDate: today,
      expiryDate: addDaysISO(today, 30),
      clientId: null,
      clientSnapshot: { companyName: '', contactName: '', email: '', phone: '', address: '' },
      lineItems: [{ id: uuid(), name: '', description: '', quantity: 1, unitPrice: 0, amount: 0, sortOrder: 0 }],
      discountType: null,
      discountValue: 0,
      vatEnabled: false,
      vatRate: 0.15,
      notes: 'This quote is valid for 30 days from issue date and may be revised after expiry.',
    },
  });

  useEffect(() => {
    quoteService.getNextQuoteNumber().then((number) => {
      methods.setValue('quoteNumber', number);
    }).catch(() => {});
  }, [methods]);

  useEffect(() => {
    if (!fromInquiry) return;

    methods.setValue('clientId', fromInquiry.clientId);
    methods.setValue('status', 'DRAFT');
    methods.setValue('notes', fromInquiry.notes || `Quote generated from inquiry for ${fromInquiry.vehicleDescription} to ${fromInquiry.destinationCountry}.`);
    methods.setValue('lineItems', [
      {
        id: uuid(),
        name: `Export Service: ${fromInquiry.vehicleDescription}`,
        description: `Destination: ${fromInquiry.destinationCountry}`,
        quantity: 1,
        unitPrice: fromInquiry.projectValue ?? 0,
        amount: fromInquiry.projectValue ?? 0,
        sortOrder: 0,
      },
    ]);
  }, [fromInquiry, methods]);

  const [quoteNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, clientSnapshot, issueDate, expiryDate, status, notes] = useWatch({
    control: methods.control,
    name: ['quoteNumber', 'lineItems', 'discountType', 'discountValue', 'vatEnabled', 'vatRate', 'clientId', 'clientSnapshot', 'issueDate', 'expiryDate', 'status', 'notes'],
  });

  const totals = calculateTotals({
    lineItems: lineItems ?? [],
    discountType: discountType ?? null,
    discountValue: discountValue ?? 0,
    vatEnabled: vatEnabled ?? false,
    vatRate: vatRate ?? 0.15,
  });

  const previewValues = { quoteNumber, lineItems, discountType, discountValue, vatEnabled, vatRate, clientId, clientSnapshot, issueDate, expiryDate, status, notes };

  const onSubmit: SubmitHandler<QuoteFormValues> = async (data) => {
    const computed = calculateTotals({
      lineItems: data.lineItems,
      discountType: data.discountType,
      discountValue: data.discountValue,
      vatEnabled: data.vatEnabled,
      vatRate: data.vatRate,
    });
    try {
      const quote = await addQuote({ ...data, ...computed, inquiryId: fromInquiry?.inquiryId ?? null } as never);
      toast.success(`Quote ${data.quoteNumber} created`);
      navigate(`/quotes/${quote.id}`);
    } catch {
      toast.error('Failed to create quote');
    }
  };

  return (
    <FormProvider {...methods}>
      <PageBackground image={invoicesBg} position="center 25%">
        <TopBar
          title="New Quote"
          subtitle={quoteNumber}
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
              <Link to="/quotes" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border text-brand-muted text-sm hover:text-brand-text hover:bg-brand-card2 transition-colors">
                <X size={15} /><span className="hidden sm:inline">Cancel</span>
              </Link>
              <button onClick={methods.handleSubmit(onSubmit)} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity" style={{ background: '#FF6B00' }}>
                <Save size={15} /><span className="hidden sm:inline">Save Quote</span><span className="sm:hidden">Save</span>
              </button>
            </div>
          }
        />

        <div className="flex-1 flex min-h-0">
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:max-w-xl xl:max-w-2xl ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
            <QuoteForm />
          </div>
          <div className={`flex-1 bg-brand-dark/60 border-l border-brand-border overflow-y-auto p-4 sm:p-6 ${activeTab === 'form' ? 'hidden lg:block' : ''}`}>
            <p className="text-xs font-head text-brand-muted uppercase tracking-wider mb-3">Live Preview</p>
            <QuotePreview quote={{ ...previewValues, ...totals } as never} />
          </div>
        </div>
      </PageBackground>
    </FormProvider>
  );
}
