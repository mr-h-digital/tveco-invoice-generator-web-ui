import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useCallback, memo } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { InvoiceFormValues } from '../../schemas/invoiceSchema';
import { formatCurrency } from '../../utils/formatCurrency';

function AmountDisplay({ index }: { index: number }) {
  const { control } = useFormContext<InvoiceFormValues>();
  const amount = useWatch({ control, name: `lineItems.${index}.amount` });
  return (
    <div className="bg-brand-night/50 border border-brand-border rounded-lg px-3 py-2.5 text-sm font-head text-right text-brand-white">
      {formatCurrency(Number(amount) || 0)}
    </div>
  );
}

interface RowProps {
  index: number;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canRemove: boolean;
  isFirst: boolean;
  isLast: boolean;
}

const Row = memo(function Row({ index, onRemove, onMoveUp, onMoveDown, canRemove, isFirst, isLast }: RowProps) {
  const { register, setValue, getValues } = useFormContext<InvoiceFormValues>();

  useEffect(() => {
    setValue(`lineItems.${index}.sortOrder`, index, { shouldDirty: true });
  }, [index, setValue]);

  const updateAmount = useCallback(() => {
    const qty   = Number(getValues(`lineItems.${index}.quantity`))  || 0;
    const price = Number(getValues(`lineItems.${index}.unitPrice`)) || 0;
    setValue(`lineItems.${index}.amount`, qty * price, { shouldDirty: true });
  }, [index, getValues, setValue]);

  return (
    <div className="py-3 border-b border-brand-border last:border-0">
      <div className="flex flex-col gap-1 mb-2">
        <input
          {...register(`lineItems.${index}.name`)}
          placeholder="Item name *"
          className="input-field text-sm"
        />
        <input
          {...register(`lineItems.${index}.description`)}
          placeholder="Detail / notes (optional)"
          className="w-full bg-transparent border border-transparent rounded-lg px-3 py-1 text-xs text-brand-muted placeholder:text-brand-muted/50 outline-none focus:border-brand-border focus:shadow-[0_0_0_2px_rgba(255,107,0,0.12)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr_auto] sm:grid-cols-[72px_120px_120px_auto] gap-2 items-center">
        <div>
          <label className="field-label text-[10px]">Qty</label>
          <input
            {...register(`lineItems.${index}.quantity`, { valueAsNumber: true, onChange: updateAmount })}
            type="number" min="0" step="0.01" placeholder="1"
            className="input-field text-sm text-right"
          />
        </div>
        <div>
          <label className="field-label text-[10px]">Unit Price (R)</label>
          <input
            {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true, onChange: updateAmount })}
            type="number" min="0" step="0.01" placeholder="0.00"
            className="input-field text-sm text-right"
          />
        </div>
        <div>
          <label className="field-label text-[10px]">Amount</label>
          <AmountDisplay index={index} />
        </div>

        <div className="flex flex-col items-center gap-1 pt-4">
          <button type="button" onClick={() => onMoveUp(index)} disabled={isFirst} aria-label="Move up"
            className="p-1 text-brand-muted hover:text-brand-text transition-colors disabled:opacity-20">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={() => onMoveDown(index)} disabled={isLast} aria-label="Move down"
            className="p-1 text-brand-muted hover:text-brand-text transition-colors disabled:opacity-20">
            <ChevronDown size={14} />
          </button>
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)} aria-label="Remove item"
              className="p-1 text-brand-muted hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export function LineItemsTable() {
  const { control } = useFormContext<InvoiceFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'lineItems' });

  const handleRemove   = useCallback((i: number) => remove(i), [remove]);
  const handleMoveUp   = useCallback((i: number) => move(i, i - 1), [move]);
  const handleMoveDown = useCallback((i: number) => move(i, i + 1), [move]);

  return (
    <div>
      <div className="hidden sm:grid grid-cols-[1fr_72px_120px_120px_auto] gap-2 pb-2 border-b border-brand-border mb-1">
        <span className="text-xs font-head text-brand-muted uppercase tracking-wider">Description</span>
        <span className="text-xs font-head text-brand-muted uppercase tracking-wider text-right">Qty</span>
        <span className="text-xs font-head text-brand-muted uppercase tracking-wider text-right">Unit Price</span>
        <span className="text-xs font-head text-brand-muted uppercase tracking-wider text-right">Amount</span>
        <div className="w-8" />
      </div>

      {fields.map((field, index) => (
        <Row
          key={field.id}
          index={index}
          onRemove={handleRemove}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          canRemove={fields.length > 1}
          isFirst={index === 0}
          isLast={index === fields.length - 1}
        />
      ))}

      <button
        type="button"
        onClick={() => append({ id: uuid(), name: '', description: '', quantity: 1, unitPrice: 0, amount: 0, sortOrder: fields.length })}
        className="mt-4 flex items-center gap-2 text-sm text-orange hover:text-orange-lt transition-colors py-1"
        style={{ color: '#FF6B00' }}
      >
        <Plus size={15} />
        Add line item
      </button>
    </div>
  );
}
