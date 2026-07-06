import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch, FormProvider, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import invoicesBg from '../assets/tveco-invoices-bg.jpg';
import { quoteFormSchema, type QuoteFormValues } from '../schemas/quoteSchema';
import { QuoteForm } from '../components/quote/QuoteForm';
import { QuotePreview } from '../components/quote/QuotePreview';
import { TopBar } from '../components/layout/TopBar';
import { PageBackground } from '../components/layout/PageBackground';
import { useQuotes, useQuote } from '../hooks/useQuotes';
import { calculateTotals } from '../utils/invoiceTotals';

export function EditQuotePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateQuote, loading } = useQuotes();
  const quote = useQuote(id);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const methods = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema) as Resolver<QuoteFormValues>,
  });

  useEffect(() => {
    if (quote) {
      methods.reset({
        quoteNumber: quote.quoteNumber,
        status: quote.status,
        issueDate: quote.issueDate,
        expiryDate: quote.expiryDate,
        clientId: quote.clientId,
        clientSnapshot: quote.clientSnapshot,
        lineItems: quote.lineItems,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        vatEnabled: quote.vatEnabled,
        vatRate: quote.vatRate,
        notes: quote.notes,
      });
    }
  }, [quote, methods]);

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
    if (!id) return;
    const computed = calculateTotals({ lineItems: data.lineItems, discountType: data.discountType, discountValue: data.discountValue, vatEnabled: data.vatEnabled, vatRate: data.vatRate });
    try {
      await updateQuote(id, { ...data, ...computed } as never);
      toast.success('Quote updated');
      navigate(`/quotes/${id}`);
    } catch {
      toast.error('Failed to update quote');
    }
  };

  if (!quote && !loading) {
    return <div className="flex-1 flex items-center justify-center text-brand-muted">Quote not found.</div>;
  }

  return (
    <FormProvider {...methods}>
      <PageBackground image={invoicesBg} position="center 25%">
        <TopBar
          title="Edit Quote"
          subtitle={quote?.quoteNumber}
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
