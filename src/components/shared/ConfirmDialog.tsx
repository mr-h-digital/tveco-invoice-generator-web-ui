import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-brand-muted text-sm mb-5">{description}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg border border-brand-border text-brand-muted text-sm hover:text-brand-text hover:bg-brand-card2 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
          {loading ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
