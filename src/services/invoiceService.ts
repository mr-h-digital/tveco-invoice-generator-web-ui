import { v4 as uuid } from 'uuid';
import type { Invoice } from '../types/invoice';
import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const STORAGE_KEY = 'tveco_invoices_v2';

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'invoice-001',
    invoiceNumber: 'TVECO-2026-001',
    status: 'SENT',
    issueDate: '2026-06-01',
    dueDate: '2026-07-01',
    clientId: 'client-001',
    exportJobId: null,
    clientSnapshot: {
      companyName: 'Kabila Muteba Enterprises',
      contactName: 'Kabila Muteba',
      email: 'kabila@example.zm',
      phone: '+260 97 000 0001',
      address: 'Lusaka, Zambia',
    },
    lineItems: [
      { id: uuid(), name: 'Vehicle Sourcing — Toyota Land Cruiser 200 Series', description: 'Sourcing, VIN verification & condition assessment', quantity: 1, unitPrice: 45000, amount: 45000, sortOrder: 0 },
      { id: uuid(), name: 'ITAC Export Permit', description: 'International Trade Administration Commission permit', quantity: 1, unitPrice: 1800, amount: 1800, sortOrder: 1 },
      { id: uuid(), name: 'SARPCO Police Clearance', description: 'SAPS theft clearance certificate', quantity: 1, unitPrice: 900, amount: 900, sortOrder: 2 },
      { id: uuid(), name: 'Sea Freight — Durban to Lusaka (via Dar es Salaam)', description: 'RoRo shipping, 4–6 week transit', quantity: 1, unitPrice: 3800, amount: 3800, sortOrder: 3 },
      { id: uuid(), name: 'Customs & Import Clearance Coordination', description: 'Documentation preparation & clearing agent liaison', quantity: 1, unitPrice: 1200, amount: 1200, sortOrder: 4 },
    ],
    subtotal: 52700,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    vatEnabled: false,
    vatRate: 0.15,
    vatAmount: 0,
    total: 52700,
    notes: 'Payment due within 14 days. EFT preferred. Please use your invoice number as payment reference. Proof of payment to enquiries@tveco.co.za.',
    paymentDetails: {
      bank: 'First National Bank (FNB)',
      accountName: 'T S Concepts and Projects Enterprises (Pty) Ltd',
      accountNumber: '63166663849',
      accountType: 'Gold Business Account',
      branchCode: '200609',
      reference: 'TVECO-2026-001',
    },
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
];

function lsLoad(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVOICES)); return DEFAULT_INVOICES; }
    return JSON.parse(raw) as Invoice[];
  } catch { return DEFAULT_INVOICES; }
}

function lsSave(invoices: Invoice[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

function toRequest(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    invoiceNumber: data.invoiceNumber,
    status: data.status,
    clientId: data.clientId ?? undefined,
    issueDate: data.issueDate,
    dueDate: data.dueDate,
    lineItems: data.lineItems.map((li, i) => ({
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      sortOrder: li.sortOrder ?? i,
    })),
    clientSnapshot: data.clientSnapshot,
    exportJobId: data.exportJobId ?? undefined,
    discountType: data.discountType || undefined,
    discountValue: data.discountValue,
    vatEnabled: data.vatEnabled,
    vatRate: data.vatRate,
    notes: data.notes,
    paymentDetails: data.paymentDetails,
  };
}

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    if (!USE_API) return lsLoad();
    const res = await api.get<{ content: Invoice[] }>('/invoices?size=200&sort=createdAt,desc');
    return res.data.content;
  },

  async getInvoice(id: string): Promise<Invoice> {
    if (!USE_API) {
      const invoice = lsLoad().find((i) => i.id === id);
      if (!invoice) throw new Error(`Invoice ${id} not found`);
      return invoice;
    }
    const res = await api.get<Invoice>(`/invoices/${id}`);
    return res.data;
  },

  async getNextInvoiceNumber(): Promise<string> {
    if (!USE_API) {
      const invoices = lsLoad();
      const year = new Date().getFullYear();
      const max = invoices
        .filter((inv) => inv.invoiceNumber.startsWith(`TVECO-${year}-`))
        .reduce((m, inv) => Math.max(m, parseInt(inv.invoiceNumber.split('-')[2] ?? '0', 10)), 0);
      return `TVECO-${year}-${String(max + 1).padStart(3, '0')}`;
    }
    const res = await api.get<{ invoiceNumber: string }>('/invoices/next-number');
    return res.data.invoiceNumber;
  },

  async createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    if (!USE_API) {
      const now = new Date().toISOString();
      const invoice: Invoice = { ...data, id: uuid(), createdAt: now, updatedAt: now };
      lsSave([...lsLoad(), invoice]);
      return invoice;
    }
    const res = await api.post<Invoice>('/invoices', toRequest(data));
    return res.data;
  },

  async updateInvoice(id: string, data: Partial<Omit<Invoice, 'id' | 'createdAt'>>): Promise<Invoice> {
    if (!USE_API) {
      const invoices = lsLoad();
      const idx = invoices.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`Invoice ${id} not found`);
      const updated: Invoice = { ...invoices[idx], ...data, updatedAt: new Date().toISOString() };
      invoices[idx] = updated;
      lsSave(invoices);
      return updated;
    }
    if (data.status && Object.keys(data).length === 1) {
      const res = await api.patch<Invoice>(`/invoices/${id}/status`, { status: data.status });
      return res.data;
    }
    const current = await invoiceService.getInvoice(id);
    const merged = { ...current, ...data };
    const res = await api.put<Invoice>(`/invoices/${id}`, toRequest(merged));
    return res.data;
  },

  async deleteInvoice(id: string): Promise<void> {
    if (!USE_API) { lsSave(lsLoad().filter((i) => i.id !== id)); return; }
    await api.delete(`/invoices/${id}`);
  },

  async duplicateInvoice(id: string): Promise<Invoice> {
    if (!USE_API) {
      const invoices = lsLoad();
      const original = invoices.find((i) => i.id === id);
      if (!original) throw new Error(`Invoice ${id} not found`);
      const year = new Date().getFullYear();
      const max = invoices
        .filter((inv) => inv.invoiceNumber.startsWith(`TVECO-${year}-`))
        .reduce((m, inv) => Math.max(m, parseInt(inv.invoiceNumber.split('-')[2] ?? '0', 10)), 0);
      const newNumber = `TVECO-${year}-${String(max + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const duplicate: Invoice = {
        ...original,
        id: uuid(),
        invoiceNumber: newNumber,
        status: 'DRAFT',
        issueDate: now.split('T')[0],
        paymentDetails: { ...original.paymentDetails, reference: newNumber },
        createdAt: now,
        updatedAt: now,
      };
      lsSave([...invoices, duplicate]);
      return duplicate;
    }
    const res = await api.post<Invoice>(`/invoices/${id}/duplicate`);
    return res.data;
  },
};
