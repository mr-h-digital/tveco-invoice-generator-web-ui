import { useEffect } from 'react';
import { useInvoiceStore } from '../store/invoiceStore';

export function useInvoices() {
  const store = useInvoiceStore();

  useEffect(() => {
    if (store.invoices.length === 0 && !store.loading) {
      store.fetchInvoices();
    }
  }, []);

  return store;
}

export function useInvoice(id: string | undefined) {
  const invoices = useInvoiceStore((s) => s.invoices);
  return id ? invoices.find((i) => i.id === id) ?? null : null;
}
