import { create } from 'zustand';
import type { Invoice } from '../types/invoice';
import { invoiceService } from '../services/invoiceService';

interface InvoiceStore {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  addInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt'>>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
  duplicateInvoice: (id: string) => Promise<Invoice>;
}

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoices: [],
  loading: false,
  error: null,

  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await invoiceService.getInvoices();
      set({ invoices, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  addInvoice: async (data) => {
    const invoice = await invoiceService.createInvoice(data);
    set((state) => ({ invoices: [...state.invoices, invoice] }));
    return invoice;
  },

  updateInvoice: async (id, data) => {
    const invoice = await invoiceService.updateInvoice(id, data);
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? invoice : i)),
    }));
    return invoice;
  },

  deleteInvoice: async (id) => {
    await invoiceService.deleteInvoice(id);
    set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) }));
  },

  duplicateInvoice: async (id) => {
    const invoice = await invoiceService.duplicateInvoice(id);
    set((state) => ({ invoices: [...state.invoices, invoice] }));
    return invoice;
  },
}));
