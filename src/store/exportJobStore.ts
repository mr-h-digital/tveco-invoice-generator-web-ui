import { create } from 'zustand';
import { exportJobService } from '../services/exportJobService';
import type { ExportJob, ExportJobStatus } from '../types/exportJob';
import { notificationService } from '../services/notificationService';

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
    projectValue: number;
    estimatedDepartureDate?: string;
    estimatedArrivalDate?: string;
    notes?: string;
  }) => Promise<ExportJob>;
  updateJob: (id: string, data: Partial<Omit<ExportJob, 'id' | 'createdAt' | 'jobNumber' | 'publicTrackingToken'>>) => Promise<ExportJob>;
  deleteJob: (id: string) => Promise<void>;
  advanceStatus: (id: string) => Promise<ExportJob | null>;
  toggleDocument: (id: string, key: string) => Promise<ExportJob | null>;
  togglePaymentMilestone: (id: string, key: string) => Promise<ExportJob | null>;
  runPaymentReminderCheck: () => Promise<number>;
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
    await notificationService.emit({
      eventType: 'EXPORT_STATUS_CHANGED',
      title: `${updated.jobNumber} moved to ${updated.status}`,
      message: `${updated.clientSnapshot.companyName} export stage is now ${updated.status}.`,
      referenceId: updated.id,
      emailTo: updated.clientSnapshot.email,
      emailSubject: `TVECO Export Update: ${updated.jobNumber}`,
      emailBody: `Your export job ${updated.jobNumber} is now in ${updated.status} stage.`,
    });
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
    const changedDoc = updated.documents.find((d) => d.key === key);
    if (changedDoc?.completed) {
      await notificationService.emit({
        eventType: 'EXPORT_DOCUMENT_COMPLETED',
        title: `${changedDoc.label} completed`,
        message: `${updated.jobNumber} document checklist item marked complete.`,
        referenceId: updated.id,
      });
    }
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },

  togglePaymentMilestone: async (id, key) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;

    const now = new Date().toISOString();
    const paymentMilestones = job.paymentMilestones.map((m) =>
      m.key === key ? { ...m, paid: !m.paid, paidAt: !m.paid ? now : null } : m
    );

    const updated = await exportJobService.updateJob(id, { paymentMilestones });
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },

  runPaymentReminderCheck: async () => {
    const today = new Date().toISOString().split('T')[0];
    let reminders = 0;

    for (const job of get().jobs) {
      for (const milestone of job.paymentMilestones) {
        if (!milestone.paid && milestone.dueDate < today) {
          reminders += 1;
          await notificationService.emit({
            eventType: 'EXPORT_PAYMENT_REMINDER',
            title: `Payment reminder: ${job.jobNumber}`,
            message: `${milestone.label} is overdue for ${job.clientSnapshot.companyName}.`,
            referenceId: job.id,
            emailTo: job.clientSnapshot.email,
            emailSubject: `Payment Reminder for ${job.jobNumber}`,
            emailBody: `A payment milestone (${milestone.label}) is overdue for export job ${job.jobNumber}.`,
          });
        }
      }
    }

    return reminders;
  },
}));
