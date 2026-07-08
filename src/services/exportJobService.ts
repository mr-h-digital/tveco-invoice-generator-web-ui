import { v4 as uuid } from 'uuid';
import type { ExportJob, ExportJobStatus } from '../types/exportJob';
import { todayISO, addDaysISO } from '../utils/formatDate';

const STORAGE_KEY = 'tveco_export_jobs_v1';

const STATUS_ORDER: ExportJobStatus[] = ['ENQUIRY', 'SOURCING', 'DOCUMENTATION', 'SHIPPING', 'DELIVERED'];

function defaultMilestones() {
  return [
    { key: 'enquiry', label: 'Enquiry Received', completedAt: null },
    { key: 'sourcing', label: 'Vehicle Sourcing', completedAt: null },
    { key: 'documentation', label: 'Export Documentation', completedAt: null },
    { key: 'shipping', label: 'Shipping in Progress', completedAt: null },
    { key: 'delivery', label: 'Delivered', completedAt: null },
  ];
}

function defaultDocuments() {
  return [
    { key: 'itac', label: 'ITAC Permit', required: true, completed: false },
    { key: 'sarpco', label: 'SARPCO Clearance', required: true, completed: false },
    { key: 'sadac', label: 'SADAC Certificate', required: false, completed: false },
    { key: 'invoice', label: 'Commercial Invoice', required: true, completed: false },
    { key: 'customs', label: 'Customs Pack', required: true, completed: false },
  ];
}

function buildPaymentMilestones(projectValue: number, issueDate: string) {
  const roundedValue = Math.max(projectValue, 0);
  const deposit = Math.round(roundedValue * 0.3 * 100) / 100;
  const shipping = Math.round(roundedValue * 0.4 * 100) / 100;
  const balance = Math.round((roundedValue - deposit - shipping) * 100) / 100;

  return [
    { key: 'deposit', label: 'Deposit (30%)', amount: deposit, dueDate: issueDate, paid: false, paidAt: null },
    { key: 'shipping', label: 'Shipping Payment (40%)', amount: shipping, dueDate: addDaysISO(issueDate, 10), paid: false, paidAt: null },
    { key: 'balance', label: 'Final Balance (30%)', amount: balance, dueDate: addDaysISO(issueDate, 28), paid: false, paidAt: null },
  ];
}

function normalizeJob(job: ExportJob): ExportJob {
  const projectValue = Number.isFinite(job.projectValue) ? job.projectValue : 0;
  return {
    ...job,
    projectValue,
    paymentMilestones:
      Array.isArray(job.paymentMilestones) && job.paymentMilestones.length > 0
        ? job.paymentMilestones
        : buildPaymentMilestones(projectValue, job.createdAt.split('T')[0]),
    vaultDocuments: Array.isArray(job.vaultDocuments) ? job.vaultDocuments : [],
  };
}

const DEFAULT_EXPORT_JOBS: ExportJob[] = [
  {
    id: 'job-001',
    jobNumber: 'TVECO-EXP-2026-001',
    publicTrackingToken: 'TVC-9A1F0C',
    clientId: null,
    clientSnapshot: {
      companyName: 'Kabila Muteba Enterprises',
      contactName: 'Kabila Muteba',
      email: 'kabila@example.zm',
      phone: '+260 97 000 0001',
    },
    destinationCountry: 'Zambia',
    vehicleDescription: 'Toyota Land Cruiser 200 Series',
    sourceChannel: 'Website',
    projectValue: 52700,
    status: 'SHIPPING',
    milestones: [
      { key: 'enquiry', label: 'Enquiry Received', completedAt: '2026-06-01T08:00:00.000Z' },
      { key: 'sourcing', label: 'Vehicle Sourcing', completedAt: '2026-06-03T10:20:00.000Z' },
      { key: 'documentation', label: 'Export Documentation', completedAt: '2026-06-09T11:30:00.000Z' },
      { key: 'shipping', label: 'Shipping in Progress', completedAt: '2026-06-12T13:00:00.000Z' },
      { key: 'delivery', label: 'Delivered', completedAt: null },
    ],
    documents: [
      { key: 'itac', label: 'ITAC Permit', required: true, completed: true },
      { key: 'sarpco', label: 'SARPCO Clearance', required: true, completed: true },
      { key: 'sadac', label: 'SADAC Certificate', required: false, completed: true },
      { key: 'invoice', label: 'Commercial Invoice', required: true, completed: true },
      { key: 'customs', label: 'Customs Pack', required: true, completed: true },
    ],
    paymentMilestones: [
      { key: 'deposit', label: 'Deposit (30%)', amount: 15810, dueDate: '2026-06-01', paid: true, paidAt: '2026-06-02T08:00:00.000Z' },
      { key: 'shipping', label: 'Shipping Payment (40%)', amount: 21080, dueDate: '2026-06-11', paid: true, paidAt: '2026-06-11T14:00:00.000Z' },
      { key: 'balance', label: 'Final Balance (30%)', amount: 15810, dueDate: '2026-06-29', paid: false, paidAt: null },
    ],
    vaultDocuments: [],
    estimatedDepartureDate: '2026-06-12',
    estimatedArrivalDate: '2026-07-05',
    notes: 'Client requested WhatsApp updates every 3 days. Destination clearing agent already confirmed.',
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-12T13:00:00.000Z',
  },
];

function lsLoad(): ExportJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPORT_JOBS));
      return DEFAULT_EXPORT_JOBS;
    }
    const parsed = JSON.parse(raw) as ExportJob[];
    const normalized = parsed.map(normalizeJob);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return DEFAULT_EXPORT_JOBS;
  }
}

function lsSave(jobs: ExportJob[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function nextJobNumber(existing: ExportJob[]): string {
  const year = new Date().getFullYear();
  const max = existing
    .filter((j) => j.jobNumber.startsWith(`TVECO-EXP-${year}-`))
    .reduce((m, j) => Math.max(m, parseInt(j.jobNumber.split('-')[3] ?? '0', 10)), 0);
  return `TVECO-EXP-${year}-${String(max + 1).padStart(3, '0')}`;
}

function statusToMilestoneIndex(status: ExportJobStatus): number {
  return STATUS_ORDER.findIndex((s) => s === status);
}

function normalizeMilestones(status: ExportJobStatus, milestones: ExportJob['milestones']) {
  const now = new Date().toISOString();
  const activeIdx = statusToMilestoneIndex(status);
  return milestones.map((ms, idx) => {
    if (idx <= activeIdx && !ms.completedAt) return { ...ms, completedAt: now };
    if (idx > activeIdx && ms.completedAt) return { ...ms, completedAt: null };
    return ms;
  });
}

export const exportJobService = {
  async getJobs(): Promise<ExportJob[]> {
    return lsLoad();
  },

  async createJob(data: {
    clientId: string | null;
    clientSnapshot: ExportJob['clientSnapshot'];
    destinationCountry: string;
    vehicleDescription: string;
    sourceChannel: ExportJob['sourceChannel'];
    projectValue: number;
    estimatedDepartureDate?: string;
    estimatedArrivalDate?: string;
    notes?: string;
  }): Promise<ExportJob> {
    const jobs = lsLoad();
    const now = new Date().toISOString();
    const issueDate = todayISO();
    const job: ExportJob = {
      id: uuid(),
      jobNumber: nextJobNumber(jobs),
      publicTrackingToken: `TVC-${uuid().slice(0, 6).toUpperCase()}`,
      clientId: data.clientId,
      clientSnapshot: data.clientSnapshot,
      destinationCountry: data.destinationCountry,
      vehicleDescription: data.vehicleDescription,
      sourceChannel: data.sourceChannel,
      projectValue: data.projectValue,
      status: 'ENQUIRY',
      milestones: [
        { key: 'enquiry', label: 'Enquiry Received', completedAt: now },
        ...defaultMilestones().slice(1),
      ],
      documents: defaultDocuments(),
      paymentMilestones: buildPaymentMilestones(data.projectValue, issueDate),
      vaultDocuments: [],
      estimatedDepartureDate: data.estimatedDepartureDate || addDaysISO(issueDate, 7),
      estimatedArrivalDate: data.estimatedArrivalDate || addDaysISO(issueDate, 35),
      notes: data.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };

    lsSave([...jobs, job]);
    return job;
  },

  async updateJob(id: string, data: Partial<Omit<ExportJob, 'id' | 'createdAt' | 'jobNumber' | 'publicTrackingToken'>>): Promise<ExportJob> {
    const jobs = lsLoad();
    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error(`Export job ${id} not found`);

    const merged: ExportJob = {
      ...jobs[idx],
      ...data,
      milestones: data.milestones ?? jobs[idx].milestones,
      documents: data.documents ?? jobs[idx].documents,
      paymentMilestones: data.paymentMilestones ?? jobs[idx].paymentMilestones,
      vaultDocuments: data.vaultDocuments ?? jobs[idx].vaultDocuments,
      updatedAt: new Date().toISOString(),
    };

    merged.milestones = normalizeMilestones(merged.status, merged.milestones);
    jobs[idx] = merged;
    lsSave(jobs);
    return merged;
  },

  async deleteJob(id: string): Promise<void> {
    lsSave(lsLoad().filter((j) => j.id !== id));
  },

  async getJobByTrackingToken(token: string): Promise<ExportJob | null> {
    const normalized = token.trim().toUpperCase();
    if (!normalized) return null;
    const match = lsLoad().find((j) => j.publicTrackingToken.toUpperCase() === normalized);
    return match ?? null;
  },
};
