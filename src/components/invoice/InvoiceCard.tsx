import { Link } from 'react-router-dom';
import { MoreVertical, Eye, Pencil, Copy, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Badge } from '../shared/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateShort } from '../../utils/formatDate';
import type { Invoice } from '../../types/invoice';

interface InvoiceCardProps {
  invoice: Invoice;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function InvoiceCard({ invoice, onDuplicate, onDelete }: InvoiceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-4 sm:p-5 hover:border-brand-muted transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/invoices/${invoice.id}`} className="min-w-0 flex-1 group">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-head text-xs text-brand-muted">{invoice.invoiceNumber}</span>
            <Badge status={invoice.status} />
          </div>
          <p className="font-head font-bold text-brand-white truncate transition-colors group-hover:text-[#FF6B00]" style={{ transition: 'color 0.15s' }}>
            {invoice.clientSnapshot.companyName}
          </p>
          {invoice.clientSnapshot.contactName && (
            <p className="text-brand-muted text-sm truncate">{invoice.clientSnapshot.contactName}</p>
          )}
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p className="font-head font-bold text-brand-white text-sm sm:text-base">{formatCurrency(invoice.total)}</p>
            <p className="text-brand-muted text-xs">Due {formatDateShort(invoice.dueDate)}</p>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Invoice actions"
              className="p-2.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-card2 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-brand-card2 border border-brand-border rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
                <Link to={`/invoices/${invoice.id}`} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text hover:bg-brand-border transition-colors" onClick={() => setMenuOpen(false)}>
                  <Eye size={14} /> View
                </Link>
                <Link to={`/invoices/${invoice.id}/edit`} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text hover:bg-brand-border transition-colors" onClick={() => setMenuOpen(false)}>
                  <Pencil size={14} /> Edit
                </Link>
                <button onClick={() => { onDuplicate(invoice.id); setMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-brand-text hover:bg-brand-border transition-colors w-full text-left">
                  <Copy size={14} /> Duplicate
                </button>
                <hr className="border-brand-border my-1" />
                <button onClick={() => { onDelete(invoice.id); setMenuOpen(false); }} className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-brand-border transition-colors w-full text-left">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-border flex-wrap">
        <span className="text-brand-muted text-xs">Issued {formatDateShort(invoice.issueDate)}</span>
        <span className="text-brand-muted text-xs">•</span>
        <span className="text-brand-muted text-xs">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
