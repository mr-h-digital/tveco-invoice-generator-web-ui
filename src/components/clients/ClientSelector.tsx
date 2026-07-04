import { useState } from 'react';
import { ChevronDown, UserPlus } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import type { Client } from '../../types/client';

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null, snapshot: Client | null) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const clients = useClientStore((s) => s.clients);
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-brand-card2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-left hover:border-brand-muted transition-colors"
      >
        <span className={selected ? 'text-brand-white' : 'text-brand-muted'}>
          {selected ? selected.companyName : 'Select a saved client…'}
        </span>
        <ChevronDown size={16} className={`text-brand-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-brand-card2 border border-brand-border rounded-xl shadow-2xl z-30 overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {clients.map((client) => (
              <button
                type="button"
                key={client.id}
                onClick={() => { onChange(client.id, client); setOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-brand-border transition-colors"
                style={value === client.id ? { background: 'rgba(255,107,0,0.1)', color: '#FF6B00' } : { color: '#C8D4E0' }}
              >
                <p className="font-medium text-sm">{client.companyName}</p>
                {client.contactName && <p className="text-xs text-brand-muted">{client.contactName}</p>}
              </button>
            ))}
          </div>
          <div className="border-t border-brand-border">
            <button
              type="button"
              onClick={() => { onChange(null, null); setOpen(false); }}
              className="w-full text-left px-4 py-3 flex items-center gap-2 text-sm text-brand-muted hover:bg-brand-border transition-colors"
            >
              <UserPlus size={14} />
              Enter client manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
