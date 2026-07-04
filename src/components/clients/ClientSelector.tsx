import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, UserPlus } from 'lucide-react';
import { useClientStore } from '../../store/clientStore';
import type { Client } from '../../types/client';

interface ClientSelectorProps {
  value: string | null;
  onChange: (clientId: string | null, snapshot: Client | null) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const clients  = useClientStore((s) => s.clients);
  const [open, setOpen] = useState(false);
  const selected = clients.find((c) => c.id === value);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Close on click-outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className="w-full flex items-center justify-between gap-2 bg-brand-card2 border border-brand-border rounded-lg px-3 py-2.5 text-sm text-left hover:border-brand-muted focus:outline-none focus:border-[#FF6B00] focus:shadow-[0_0_0_3px_rgba(255,107,0,0.15)] transition-colors"
      >
        <span className={selected ? 'text-brand-white' : 'text-brand-muted'}>
          {selected ? selected.companyName : 'Select a saved client…'}
        </span>
        <ChevronDown
          size={16}
          className={`text-brand-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Saved clients"
          className="absolute top-full left-0 right-0 mt-1 bg-brand-card2 border border-brand-border rounded-xl shadow-2xl z-30 overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto">
            {clients.length === 0 ? (
              <p className="px-4 py-3 text-sm text-brand-muted">No clients saved yet.</p>
            ) : clients.map((client) => (
              <button
                type="button"
                role="option"
                aria-selected={value === client.id}
                key={client.id}
                onClick={() => { onChange(client.id, client); setOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-brand-border transition-colors focus:outline-none focus:bg-brand-border"
                style={value === client.id
                  ? { background: 'rgba(255,107,0,0.1)', color: '#FF6B00' }
                  : { color: '#C8D4E0' }
                }
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
              className="w-full text-left px-4 py-3 flex items-center gap-2 text-sm text-brand-muted hover:bg-brand-border transition-colors focus:outline-none focus:bg-brand-border"
            >
              <UserPlus size={14} aria-hidden="true" />
              Enter client manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
