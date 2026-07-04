import { useEffect } from 'react';
import { useClientStore } from '../store/clientStore';

export function useClients() {
  const store = useClientStore();

  useEffect(() => {
    if (store.clients.length === 0 && !store.loading) {
      store.fetchClients();
    }
  }, []);

  return store;
}
