export type ExportJobStatus =
  | 'ENQUIRY'
  | 'SOURCING'
  | 'DOCUMENTATION'
  | 'SHIPPING'
  | 'DELIVERED';

export interface ExportJobMilestone {
  key: string;
  label: string;
  completedAt: string | null;
}

export interface ExportJobDocument {
  key: string;
  label: string;
  required: boolean;
  completed: boolean;
}

export interface ExportJobPaymentMilestone {
  key: string;
  label: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidAt: string | null;
}

export interface ExportJobClientSnapshot {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
}

export interface ExportJob {
  id: string;
  jobNumber: string;
  publicTrackingToken: string;
  clientId: string | null;
  clientSnapshot: ExportJobClientSnapshot;
  destinationCountry: string;
  vehicleDescription: string;
  sourceChannel: 'Website' | 'WhatsApp' | 'Referral' | 'Direct';
  projectValue: number;
  status: ExportJobStatus;
  milestones: ExportJobMilestone[];
  documents: ExportJobDocument[];
  paymentMilestones: ExportJobPaymentMilestone[];
  estimatedDepartureDate: string;
  estimatedArrivalDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
