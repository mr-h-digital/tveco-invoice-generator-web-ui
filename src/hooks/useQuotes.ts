import { useEffect, useRef } from 'react';
import { useQuoteStore } from '../store/quoteStore';

export function useQuotes() {
  const store = useQuoteStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current && store.quotes.length === 0 && !store.loading) {
      fetched.current = true;
      store.fetchQuotes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

export function useQuote(id: string | undefined) {
  const quotes = useQuoteStore((s) => s.quotes);
  return id ? quotes.find((q) => q.id === id) ?? null : null;
}
