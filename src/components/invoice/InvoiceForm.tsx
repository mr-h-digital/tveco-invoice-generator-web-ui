import { useEffect, useCallback, useMemo } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { ClientSelector } from '../clients/ClientSelector';
import { LineItemsTable } from './LineItemsTable';
import type { InvoiceFormValues } from '../../schemas/invoiceSchema';
import type { Client } from '../../types/client';
import { calculateTotals } from '../../utils/invoiceTotals';
import { formatCurrency } from '../../utils/formatCurrency';
import { useExportJobs } from '../../hooks/useExportJobs';
import { v4 as uuid } from 'uuid';

const DEFAULT_PAYMENT = {
  bank: 'First National Bank (FNB)',
  accountName: 'T S Concepts and Projects Enterprises (Pty) Ltd',
  accountNumber: '63166663849',
  accountType: 'Gold Business Account',
  branchCode: '200609',
};

export function InvoiceForm() {
  const { register, control, setValue, formState: { errors } } = useFormContext<InvoiceFormValues>();
  const { jobs } = useExportJobs();

  const [lineItems, discountType, discountValue, vatEnabled, vatRate, invoiceNumber, clientId, exportJobId, paymentMilestoneKey] = useWatch({
    control,
    name: ['lineItems', 'discountType', 'discountValue', 'vatEnabled', 'vatRate', 'invoiceNumber', 'clientId', 'exportJobId', 'paymentMilestoneKey'],
  });

  const selectedJob = useMemo(() => jobs.find((job) => job.id === exportJobId) ?? null, [exportJobId, jobs]);

  const milestoneOptions = useMemo(() => selectedJob?.paymentMilestones ?? [], [selectedJob]);

  const selectedScope = useMemo(() => {
    if (!selectedJob) return null;
    if (paymentMilestoneKey) {
      return milestoneOptions.find((milestone) => milestone.key === paymentMilestoneKey) ?? null;
    }
    const amount = milestoneOptions.reduce((sum, milestone) => sum + milestone.amount, 0) || selectedJob.projectValue;
    return {
      key: '__entire_job__',
      label: `Entire export job (${selectedJob.jobNumber})`,
      amount,
    };
  }, [milestoneOptions, paymentMilestoneKey, selectedJob]);

  const selectedScopeAmount = selectedScope ? Number(selectedScope.amount.toFixed(2)) : null;
  const selectedScopeLabel = selectedScope?.label ?? null;

  const exportJobOptions = useMemo(() => {
    if (!clientId) return jobs;
    return jobs.filter((job) => !job.clientId || job.clientId === clientId);
  }, [clientId, jobs]);

  const totals = calculateTotals({
    lineItems: lineItems ?? [],
    discountType: discountType ?? null,
    discountValue: discountValue ?? 0,
    vatEnabled: vatEnabled ?? false,
    vatRate: vatRate ?? 0.15,
  });

  useEffect(() => {
    setValue('subtotal' as never, totals.subtotal as never);
    setValue('discountAmount' as never, totals.discountAmount as never);
    setValue('vatAmount' as never, totals.vatAmount as never);
    setValue('total' as never, totals.total as never);
  }, [totals.subtotal, totals.discountAmount, totals.vatAmount, totals.total, setValue]);

  useEffect(() => {
    if (!exportJobId) return;
    const selectedStillValid = exportJobOptions.some((job) => job.id === exportJobId);
    if (!selectedStillValid) {
      setValue('exportJobId', null);
      setValue('paymentMilestoneKey', null);
    }
  }, [exportJobId, exportJobOptions, setValue]);

  useEffect(() => {
    if (!selectedJob) return;

    if (paymentMilestoneKey && !milestoneOptions.some((milestone) => milestone.key === paymentMilestoneKey)) {
      setValue('paymentMilestoneKey', null);
      return;
    }

    if (selectedScopeAmount == null || !selectedScopeLabel) return;

    const current = lineItems?.[0];
    const nextName = selectedScopeLabel;
    const nextDescription = paymentMilestoneKey
      ? `Invoice raised against payment milestone ${paymentMilestoneKey} for export job ${selectedJob.jobNumber}`
      : `Invoice raised against the full export job ${selectedJob.jobNumber}`;

    const currentMatches =
      lineItems?.length === 1 &&
      current?.name === nextName &&
      current?.description === nextDescription &&
      current?.quantity === 1 &&
      Number(current?.unitPrice ?? 0) === selectedScopeAmount &&
      Number(current?.amount ?? 0) === selectedScopeAmount;

    if (!currentMatches) {
      setValue('lineItems', [
        {
          id: current?.id ?? uuid(),
          name: nextName,
          description: nextDescription,
          quantity: 1,
          unitPrice: selectedScopeAmount,
          amount: selectedScopeAmount,
          sortOrder: 0,
        },
      ]);
    }
  }, [lineItems, milestoneOptions, paymentMilestoneKey, selectedJob, selectedScopeAmount, selectedScopeLabel, setValue]);

  const handleClientChange = useCallback(
    (id: string | null, client: Client | null) => {
      setValue('clientId', id);
      setValue('exportJobId', null);
      setValue('paymentMilestoneKey', null);
      if (client) {
        setValue('clientSnapshot.companyName', client.companyName);
        setValue('clientSnapshot.contactName', client.contactName);
        setValue('clientSnapshot.email', client.email);
        setValue('clientSnapshot.phone', client.phone);
        setValue('clientSnapshot.address', client.address);
      } else {
        setValue('clientSnapshot.companyName', '');
        setValue('clientSnapshot.contactName', '');
        setValue('clientSnapshot.email', '');
        setValue('clientSnapshot.phone', '');
        setValue('clientSnapshot.address', '');
      }
    },
    [setValue]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Invoice meta */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-4">Invoice Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="field-label">Invoice Number</label>
            <input {...register('invoiceNumber')} className="input-field font-head" />
            {errors.invoiceNumber && <p className="field-error">{errors.invoiceNumber.message}</p>}
          </div>
          <div>
            <label className="field-label">Status</label>
            <select {...register('status')} className="input-field">
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div>
            <label className="field-label">Issue Date</label>
            <input {...register('issueDate')} type="date" className="input-field" />
            {errors.issueDate && <p className="field-error">{errors.issueDate.message}</p>}
          </div>
          <div>
            <label className="field-label">Due Date</label>
            <input {...register('dueDate')} type="date" className="input-field" />
            {errors.dueDate && <p className="field-error">{errors.dueDate.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Linked Export Job (optional)</label>
            <Controller
              control={control}
              name="exportJobId"
              render={({ field }) => (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="input-field"
                >
                  <option value="">No export job link</option>
                  {exportJobOptions.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.jobNumber} - {job.clientSnapshot.companyName}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-xs text-brand-muted mt-1">Linking locks the invoice subtotal to the selected export job amount for audit-safe billing.</p>
          </div>

          {selectedJob && (
            <div className="sm:col-span-2">
              <label className="field-label">Invoice Scope</label>
              <Controller
                control={control}
                name="paymentMilestoneKey"
                render={({ field }) => (
                  <select
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                    className="input-field"
                  >
                    <option value="">Entire export job</option>
                    {milestoneOptions.map((milestone) => (
                      <option key={milestone.key} value={milestone.key}>
                        {milestone.label} - {formatCurrency(milestone.amount)}
                      </option>
                    ))}
                  </select>
                )}
              />
              <p className="text-xs text-brand-muted mt-1">
                The invoice subtotal will match the selected scope before any discount or VAT is applied.
              </p>
            </div>
          )}

          {selectedScopeAmount != null && selectedScopeLabel && (
            <div className="sm:col-span-2 rounded-lg border border-brand-border bg-brand-night/30 p-3 text-xs text-brand-muted">
              Billed gross amount: <span className="text-brand-white font-head">{formatCurrency(selectedScopeAmount)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Client */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-4">Client</h3>
        <Controller
          control={control}
          name="clientId"
          render={({ field }) => (
            <ClientSelector value={field.value} onChange={handleClientChange} />
          )}
        />
        <div className="grid grid-cols-1 gap-3 mt-4">
          <div>
            <label htmlFor="client-company" className="field-label">Company Name *</label>
            <input id="client-company" {...register('clientSnapshot.companyName')} className="input-field" placeholder="Client company name" autoComplete="organization" />
            {errors.clientSnapshot?.companyName && <p className="field-error">{errors.clientSnapshot.companyName.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="client-contact" className="field-label">Contact Name</label>
              <input id="client-contact" {...register('clientSnapshot.contactName')} className="input-field" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="client-email" className="field-label">Email</label>
              <input id="client-email" {...register('clientSnapshot.email')} type="email" className="input-field" autoComplete="email" inputMode="email" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="client-phone" className="field-label">Phone</label>
              <input id="client-phone" {...register('clientSnapshot.phone')} className="input-field" autoComplete="tel" inputMode="tel" />
            </div>
            <div>
              <label htmlFor="client-address" className="field-label">Address / Country</label>
              <input id="client-address" {...register('clientSnapshot.address')} className="input-field" autoComplete="street-address" />
            </div>
          </div>
        </div>
      </section>

      {/* Line items */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-4">Line Items</h3>
        <div className="overflow-x-auto">
          <LineItemsTable />
        </div>
        {errors.lineItems && typeof errors.lineItems === 'object' && 'message' in errors.lineItems && (
          <p className="field-error mt-2">{String(errors.lineItems.message)}</p>
        )}
        {selectedJob && (
          <p className="text-xs text-brand-muted mt-2">
            Line items are locked to the selected export-job scope so the invoice gross amount stays audit-safe.
          </p>
        )}
      </section>

      {/* Totals */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-4">Totals</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-muted">Subtotal</span>
            <span className="font-head text-brand-white">{formatCurrency(totals.subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="border border-brand-border rounded-lg p-3 space-y-2">
            <label className="field-label">Discount</label>
            <div className="flex gap-2">
              <select
                {...register('discountType', {
                  setValueAs: (value) => (value === '' ? null : value),
                })}
                className="input-field w-36"
              >
                <option value="">None</option>
                <option value="AMOUNT">Amount (R)</option>
                <option value="PERCENT">Percent (%)</option>
              </select>
              {discountType && (
                <input
                  {...register('discountValue', { valueAsNumber: true })}
                  type="number" min="0" step="0.01"
                  className="input-field flex-1"
                  placeholder={discountType === 'PERCENT' ? 'e.g. 10' : 'e.g. 500'}
                />
              )}
            </div>
            {totals.discountAmount > 0 && (
              <p className="text-xs text-red-400 font-head">-{formatCurrency(totals.discountAmount)}</p>
            )}
          </div>

          {/* VAT */}
          <div className="flex items-center justify-between border border-brand-border rounded-lg p-3">
            <div>
              <label className="field-label mb-0">VAT (15%)</label>
              <p className="text-xs text-brand-muted">South African VAT</p>
            </div>
            <div className="flex items-center gap-3">
              {vatEnabled && (
                <span className="font-head text-sm text-brand-text">+{formatCurrency(totals.vatAmount)}</span>
              )}
              <Controller
                control={control}
                name="vatEnabled"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    aria-checked={field.value}
                    role="switch"
                    aria-label="Toggle VAT"
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${field.value ? 'bg-orange' : 'bg-brand-border'}`}
                    style={field.value ? { background: '#FF6B00' } : {}}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${field.value ? 'left-6' : 'left-1'}`} />
                  </button>
                )}
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg p-4" style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)' }}>
            <span className="font-head text-xs uppercase tracking-wider" style={{ color: '#FF6B00' }}>Total Due</span>
            <span className="font-head text-xl sm:text-2xl font-bold" style={{ color: '#FF6B00' }}>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-3">Notes / Payment Terms</h3>
        <textarea
          {...register('notes')}
          rows={3}
          className="input-field resize-none"
          placeholder="Payment terms, thank you note, project details…"
        />
      </section>

      {/* Payment details */}
      <section className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5">
        <h3 className="font-head font-bold text-brand-white text-sm mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ['bank', 'Bank'],
              ['accountName', 'Account Name'],
              ['accountNumber', 'Account Number'],
              ['accountType', 'Account Type'],
              ['branchCode', 'Branch Code'],
              ['reference', 'Reference'],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className="field-label">{label}</label>
              <input
                {...register(`paymentDetails.${field}`)}
                className="input-field font-head text-sm"
                placeholder={field === 'reference' ? invoiceNumber : DEFAULT_PAYMENT[field as keyof typeof DEFAULT_PAYMENT]}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
