import { create } from 'zustand';
import { exportJobService } from '../services/exportJobService';
import type { ExportJob, ExportJobStatus } from '../types/exportJob';
import { notificationService } from '../services/notificationService';
import { buildDocumentCompletedEmail, buildPaymentReminderEmail, buildStatusChangedEmail } from '../utils/exportEmailTemplates';
import { v4 as uuid } from 'uuid';

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
  addVaultDocument: (id: string, file: {
    name: string;
    mimeType: string;
    sizeBytes: number;
    category: 'Compliance' | 'Shipping' | 'Customs' | 'Payment' | 'General';
    visibleToClient: boolean;
    dataUrl: string;
  }) => Promise<ExportJob | null>;
  toggleVaultDocumentVisibility: (id: string, docId: string) => Promise<ExportJob | null>;
  deleteVaultDocument: (id: string, docId: string) => Promise<ExportJob | null>;
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
    const statusEmail = buildStatusChangedEmail(updated);
    await notificationService.emit({
      eventType: 'EXPORT_STATUS_CHANGED',
      title: `${updated.jobNumber} moved to ${updated.status}`,
      message: `${updated.clientSnapshot.companyName} export stage is now ${updated.status}.`,
      referenceId: updated.id,
      emailTo: updated.clientSnapshot.email,
      emailSubject: statusEmail.subject,
      emailBody: statusEmail.text,
      emailHtmlBody: statusEmail.html,
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
      const docEmail = buildDocumentCompletedEmail(updated, changedDoc);
      await notificationService.emit({
        eventType: 'EXPORT_DOCUMENT_COMPLETED',
        title: `${changedDoc.label} completed`,
        message: `${updated.jobNumber} document checklist item marked complete.`,
        referenceId: updated.id,
        emailTo: updated.clientSnapshot.email,
        emailSubject: docEmail.subject,
        emailBody: docEmail.text,
        emailHtmlBody: docEmail.html,
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

  addVaultDocument: async (id, file) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;

    const vaultDocuments = [
      ...job.vaultDocuments,
      {
        id: uuid(),
        name: file.name,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        category: file.category,
        visibleToClient: file.visibleToClient,
        dataUrl: file.dataUrl,
        uploadedAt: new Date().toISOString(),
      },
    ];

    const updated = await exportJobService.updateJob(id, { vaultDocuments });
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },

  toggleVaultDocumentVisibility: async (id, docId) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;

    const vaultDocuments = job.vaultDocuments.map((doc) =>
      doc.id === docId ? { ...doc, visibleToClient: !doc.visibleToClient } : doc
    );

    const updated = await exportJobService.updateJob(id, { vaultDocuments });
    set((state) => ({ jobs: state.jobs.map((j) => (j.id === id ? updated : j)) }));
    return updated;
  },

  deleteVaultDocument: async (id, docId) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return null;

    const vaultDocuments = job.vaultDocuments.filter((doc) => doc.id !== docId);
    const updated = await exportJobService.updateJob(id, { vaultDocuments });
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
          const paymentEmail = buildPaymentReminderEmail(job, milestone);
          await notificationService.emit({
            eventType: 'EXPORT_PAYMENT_REMINDER',
            title: `Payment reminder: ${job.jobNumber}`,
            message: `${milestone.label} is overdue for ${job.clientSnapshot.companyName}.`,
            referenceId: job.id,
            emailTo: job.clientSnapshot.email,
            emailSubject: paymentEmail.subject,
            emailBody: paymentEmail.text,
            emailHtmlBody: paymentEmail.html,
          });
        }
      }
    }

    return reminders;
  },
}));
