import { useEffect, useRef } from 'react';
import { useInvoiceStore } from '../store/invoiceStore';

export function useInvoices() {
  const store = useInvoiceStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current && store.invoices.length === 0 && !store.loading) {
      fetched.current = true;
      store.fetchInvoices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

export function useInvoice(id: string | undefined) {
  const invoices = useInvoiceStore((s) => s.invoices);
  return id ? invoices.find((i) => i.id === id) ?? null : null;
}
