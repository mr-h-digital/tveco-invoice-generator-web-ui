import { create } from 'zustand';
import { exportJobService } from '../services/exportJobService';
import type { ExportJob, ExportJobStatus } from '../types/exportJob';

const STATUS_ORDER: ExportJobStatus[] = ['ENQUIRY', 'SOURCING', 'DOCUMENTATION', 'SHIPPING', 'DELIVERED'];

interface ExportJobStore {
  jobs: ExportJob[];
  loading: boolean;
  error: string | null;
  fetchJobs: () => Promise<void>;
  addJob: (data: {
    clientId: string | null;
    clientSnapshot: ExportJob['clientSnapshot'];
    destinationCountry: string;
    vehicleDescription: string;
    sourceChannel: ExportJob['sourceChannel'];
    estimatedDepartureDate?: string;
    estimatedArrivalDate?: string;
    notes?: string;
  }) => Promise<ExportJob>;
  updateJob: (id: string, data: Partial<Omit<ExportJob, 'id' | 'createdAt' | 'jobNumber' | 'publicTrackingToken'>>) => Promise<ExportJob>;
  deleteJob: (id: string) => Promise<void>;
  advanceStatus: (id: string) => Promise<ExportJob | null>;
  toggleDocument: (id: string, key: string) => Promise<ExportJob | null>;
}

export const useExportJobStore = create<ExportJobStore>((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const jobs = await exportJobService.getJobs();
      set({ jobs, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  addJob: async (data) => {
    const job = await exportJobService.createJob(data);
    set((state) => ({ jobs: [...state.jobs, job] }));
    return job;
  },

  updateJob: async (id, data) => {
    const job = await exportJobService.updateJob(id, data);
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? job : j)) }));
    return job;
  },

  deleteJob: async (id) => {
    await exportJobService.deleteJob(id);
    set((state) => ({ jobs: state.jobs.filter((j) => j.id !== id) }));
  },

  advanceStatus: async (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;
    const currentIdx = STATUS_ORDER.findIndex((s) => s === job.status);
    if (currentIdx === -1 || currentIdx >= STATUS_ORDER.length - 1) return job;

    const updated = await exportJobService.updateJob(id, { status: STATUS_ORDER[currentIdx + 1] });
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },

  toggleDocument: async (id, key) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;

    const documents = job.documents.map((doc) =>
      doc.key === key ? { ...doc, completed: !doc.completed } : doc
    );

    const updated = await exportJobService.updateJob(id, { documents });
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },
}));
