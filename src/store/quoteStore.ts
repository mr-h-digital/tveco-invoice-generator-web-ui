import { create } from 'zustand';
import type { Quote } from '../types/quote';
import { quoteService } from '../services/quoteService';

interface QuoteStore {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  fetchQuotes: () => Promise<void>;
  refreshQuotes: () => Promise<void>;
  addQuote: (data: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Quote>;
  updateQuote: (id: string, data: Partial<Omit<Quote, 'id' | 'createdAt'>>) => Promise<Quote>;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string) => Promise<Quote>;
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  quotes: [],
  loading: false,
  error: null,

  fetchQuotes: async () => {
    set({ loading: true, error: null });
    try {
      const quotes = await quoteService.getQuotes();
      set({ quotes, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  refreshQuotes: async () => {
    try {
      const quotes = await quoteService.getQuotes();
      set({ quotes, error: null });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addQuote: async (data) => {
    const quote = await quoteService.createQuote(data);
    set((state) => ({ quotes: [...state.quotes, quote] }));
    return quote;
  },

  updateQuote: async (id, data) => {
    const quote = await quoteService.updateQuote(id, data);
    set((state) => ({
      quotes: state.quotes.map((q) => (q.id === id ? quote : q)),
    }));
    return quote;
  },

  deleteQuote: async (id) => {
    await quoteService.deleteQuote(id);
    set((state) => ({ quotes: state.quotes.filter((q) => q.id !== id) }));
  },

  duplicateQuote: async (id) => {
    const quote = await quoteService.duplicateQuote(id);
    set((state) => ({ quotes: [...state.quotes, quote] }));
    return quote;
  },
}));
