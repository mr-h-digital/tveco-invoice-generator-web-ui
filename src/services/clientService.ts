import { v4 as uuid } from 'uuid';
import type { Client } from '../types/client';
import api from './api';

const USE_API = import.meta.env.VITE_USE_API === 'true' || import.meta.env.PROD;
const STORAGE_KEY = 'tveco_clients_v2';

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'client-001',
    companyName: 'Kabila Muteba Enterprises',
    contactName: 'Kabila Muteba',
    email: 'kabila@example.zm',
    phone: '+260 97 000 0001',
    address: 'Lusaka, Zambia',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-01-15T08:00:00.000Z',
  },
  {
    id: 'client-002',
    companyName: 'Francisco Alves Transportes Lda',
    contactName: 'Francisco Alves',
    email: 'f.alves@example.mz',
    phone: '+258 84 000 0002',
    address: 'Maputo, Mozambique',
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-02-10T08:00:00.000Z',
  },
  {
    id: 'client-003',
    companyName: 'Rashid Nkosi Motors (Pvt) Ltd',
    contactName: 'Rashid Nkosi',
    email: 'r.nkosi@example.zw',
    phone: '+263 77 000 0003',
    address: 'Harare, Zimbabwe',
    createdAt: '2026-03-05T08:00:00.000Z',
    updatedAt: '2026-03-05T08:00:00.000Z',
  },
];

function lsLoad(): Client[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CLIENTS)); return DEFAULT_CLIENTS; }
    return JSON.parse(raw) as Client[];
  } catch { return DEFAULT_CLIENTS; }
}

function lsSave(clients: Client[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export const clientService = {
  async getClients(): Promise<Client[]> {
    if (!USE_API) return lsLoad();
    const res = await api.get<Client[]>('/clients');
    return res.data;
  },

  async getClient(id: string): Promise<Client> {
    if (!USE_API) {
      const client = lsLoad().find((c) => c.id === id);
      if (!client) throw new Error(`Client ${id} not found`);
      return client;
    }
    const res = await api.get<Client>(`/clients/${id}`);
    return res.data;
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    if (!USE_API) {
      const now = new Date().toISOString();
      const client: Client = { ...data, id: uuid(), createdAt: now, updatedAt: now };
      lsSave([...lsLoad(), client]);
      return client;
    }
    const res = await api.post<Client>('/clients', data);
    return res.data;
  },

  async updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    if (!USE_API) {
      const clients = lsLoad();
      const idx = clients.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Client ${id} not found`);
      const updated: Client = { ...clients[idx], ...data, updatedAt: new Date().toISOString() };
      clients[idx] = updated;
      lsSave(clients);
      return updated;
    }
    const res = await api.put<Client>(`/clients/${id}`, data);
    return res.data;
  },

  async deleteClient(id: string): Promise<void> {
    if (!USE_API) { lsSave(lsLoad().filter((c) => c.id !== id)); return; }
    await api.delete(`/clients/${id}`);
  },
};
