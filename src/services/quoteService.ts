import { v4 as uuid } from 'uuid';
import type { Quote } from '../types/quote';
import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;
const STORAGE_KEY = 'tveco_quotes_v1';

const DEFAULT_QUOTES: Quote[] = [
  {
    id: 'quote-001',
    quoteNumber: 'QUO-2026-001',
    status: 'SENT',
    issueDate: '2026-06-01',
    expiryDate: '2026-06-30',
    clientId: 'client-001',
    clientSnapshot: {
      companyName: 'Kabila Muteba Enterprises',
      contactName: 'Kabila Muteba',
      email: 'kabila@example.zm',
      phone: '+260 97 000 0001',
      address: 'Lusaka, Zambia',
    },
    lineItems: [
      { id: uuid(), name: 'Vehicle Sourcing - Toyota Land Cruiser 200 Series', description: 'Sourcing, VIN verification and condition assessment', quantity: 1, unitPrice: 45000, amount: 45000, sortOrder: 0 },
      { id: uuid(), name: 'ITAC Export Permit', description: 'International Trade Administration Commission permit', quantity: 1, unitPrice: 1800, amount: 1800, sortOrder: 1 },
      { id: uuid(), name: 'Sea Freight - Durban to Lusaka', description: 'RoRo shipping, 4-6 week transit', quantity: 1, unitPrice: 3800, amount: 3800, sortOrder: 2 },
    ],
    subtotal: 50600,
    discountType: null,
    discountValue: 0,
    discountAmount: 0,
    vatEnabled: false,
    vatRate: 0.15,
    vatAmount: 0,
    total: 50600,
    notes: 'Quote valid for 30 days from issue date. Pricing and availability subject to change after expiry.',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-01T09:00:00.000Z',
  },
];

function lsLoad(): Quote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_QUOTES));
      return DEFAULT_QUOTES;
    }
    return JSON.parse(raw) as Quote[];
  } catch {
    return DEFAULT_QUOTES;
  }
}

function lsSave(quotes: Quote[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function toRequest(data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    quoteNumber: data.quoteNumber,
    status: data.status,
    clientId: data.clientId ?? undefined,
    inquiryId: data.inquiryId ?? undefined,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    lineItems: data.lineItems.map((li, i) => ({
      name: li.name,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      sortOrder: li.sortOrder ?? i,
    })),
    clientSnapshot: data.clientSnapshot,
    discountType: data.discountType || undefined,
    discountValue: data.discountValue,
    vatEnabled: data.vatEnabled,
    vatRate: data.vatRate,
    notes: data.notes,
  };
}

export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    if (!USE_API) return lsLoad();
    const res = await api.get<{ content: Quote[] }>('/quotes?size=200&sort=createdAt,desc');
    return res.data.content;
  },

  async getQuote(id: string): Promise<Quote> {
    if (!USE_API) {
      const quote = lsLoad().find((q) => q.id === id);
      if (!quote) throw new Error(`Quote ${id} not found`);
      return quote;
    }
    const res = await api.get<Quote>(`/quotes/${id}`);
    return res.data;
  },

  async getNextQuoteNumber(): Promise<string> {
    if (!USE_API) {
      const quotes = lsLoad();
      const year = new Date().getFullYear();
      const max = quotes
        .filter((q) => q.quoteNumber.startsWith(`QUO-${year}-`))
        .reduce((m, q) => Math.max(m, parseInt(q.quoteNumber.split('-')[2] ?? '0', 10)), 0);
      return `QUO-${year}-${String(max + 1).padStart(3, '0')}`;
    }
    const res = await api.get<{ quoteNumber: string }>('/quotes/next-number');
    return res.data.quoteNumber;
  },

  async createQuote(data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    if (!USE_API) {
      const now = new Date().toISOString();
      const quote: Quote = { ...data, id: uuid(), createdAt: now, updatedAt: now };
      lsSave([...lsLoad(), quote]);
      return quote;
    }
    const res = await api.post<Quote>('/quotes', toRequest(data));
    return res.data;
  },

  async updateQuote(id: string, data: Partial<Omit<Quote, 'id' | 'createdAt'>>): Promise<Quote> {
    if (!USE_API) {
      const quotes = lsLoad();
      const idx = quotes.findIndex((q) => q.id === id);
      if (idx === -1) throw new Error(`Quote ${id} not found`);
      const updated: Quote = { ...quotes[idx], ...data, updatedAt: new Date().toISOString() };
      quotes[idx] = updated;
      lsSave(quotes);
      return updated;
    }
    if (data.status && Object.keys(data).length === 1) {
      const res = await api.patch<Quote>(`/quotes/${id}/status`, { status: data.status });
      return res.data;
    }
    const current = await quoteService.getQuote(id);
    const merged = { ...current, ...data };
    const res = await api.put<Quote>(`/quotes/${id}`, toRequest(merged));
    return res.data;
  },

  async deleteQuote(id: string): Promise<void> {
    if (!USE_API) {
      lsSave(lsLoad().filter((q) => q.id !== id));
      return;
    }
    await api.delete(`/quotes/${id}`);
  },

  async duplicateQuote(id: string): Promise<Quote> {
    if (!USE_API) {
      const quotes = lsLoad();
      const original = quotes.find((q) => q.id === id);
      if (!original) throw new Error(`Quote ${id} not found`);
      const year = new Date().getFullYear();
      const max = quotes
        .filter((q) => q.quoteNumber.startsWith(`QUO-${year}-`))
        .reduce((m, q) => Math.max(m, parseInt(q.quoteNumber.split('-')[2] ?? '0', 10)), 0);
      const newNumber = `QUO-${year}-${String(max + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const duplicate: Quote = {
        ...original,
        id: uuid(),
        quoteNumber: newNumber,
        status: 'DRAFT',
        issueDate: now.split('T')[0],
        createdAt: now,
        updatedAt: now,
      };
      lsSave([...quotes, duplicate]);
      return duplicate;
    }
    const res = await api.post<Quote>(`/quotes/${id}/duplicate`);
    return res.data;
  },
};
