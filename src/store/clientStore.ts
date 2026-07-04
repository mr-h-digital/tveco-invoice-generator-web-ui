import { create } from 'zustand';
import type { Client } from '../types/client';
import { clientService } from '../services/clientService';

interface ClientStore {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [],
  loading: false,
  error: null,

  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const clients = await clientService.getClients();
      set({ clients, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  addClient: async (data) => {
    const client = await clientService.createClient(data);
    set((state) => ({ clients: [...state.clients, client] }));
    return client;
  },

  updateClient: async (id, data) => {
    const client = await clientService.updateClient(id, data);
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? client : c)),
    }));
    return client;
  },

  deleteClient: async (id) => {
    await clientService.deleteClient(id);
    set((state) => ({ clients: state.clients.filter((c) => c.id !== id) }));
  },
}));
