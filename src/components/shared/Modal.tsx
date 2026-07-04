import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: [0.34, 1.1, 0.64, 1] }}
              className={`relative w-full ${SIZE[size]} bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                <h3 className="font-head font-bold text-brand-white">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg text-brand-muted hover:text-brand-white hover:bg-brand-card2 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5">{children}</div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
