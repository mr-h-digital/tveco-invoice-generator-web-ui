import { useEffect, useRef } from 'react';
import { useClientStore } from '../store/clientStore';

export function useClients() {
  const store = useClientStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!fetched.current && store.clients.length === 0 && !store.loading) {
      fetched.current = true;
      store.fetchClients();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
