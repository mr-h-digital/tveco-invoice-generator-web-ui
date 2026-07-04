import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema, type ClientFormValues } from '../../schemas/clientSchema';

interface ClientFormProps {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function ClientForm({ defaultValues, onSubmit, onCancel, submitLabel = 'Save Client' }: ClientFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { companyName: '', contactName: '', email: '', phone: '', address: '', ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="field-label">Company Name *</label>
        <input {...register('companyName')} className="input-field" placeholder="Acme Imports Ltd" />
        {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>}
      </div>

      <div>
        <label className="field-label">Contact Name</label>
        <input {...register('contactName')} className="input-field" placeholder="Jane Smith" />
        {errors.contactName && <p className="text-red-400 text-xs mt-1">{errors.contactName.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Email</label>
          <input {...register('email')} type="email" className="input-field" placeholder="jane@acme.zm" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="field-label">Phone / WhatsApp</label>
          <input {...register('phone')} className="input-field" placeholder="+260 97 000 0000" />
        </div>
      </div>

      <div>
        <label className="field-label">Address / Country</label>
        <textarea {...register('address')} rows={2} className="input-field resize-none" placeholder="Lusaka, Zambia" />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-brand-border text-brand-text text-sm hover:bg-brand-card2 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50" style={{ background: '#FF6B00' }}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
