export type ExportInquiryType = 'INQUIRY' | 'REQUEST';

export type ExportInquiryStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'WAITING_ON_CLIENT'
  | 'READY_FOR_QUOTE'
  | 'QUOTED'
  | 'CONVERTED_TO_JOB'
  | 'CLOSED';

export interface ExportInquiryMessage {
  id: string;
  inquiryId: string;
  senderRole: 'ADMIN' | 'CLIENT';
  senderEmail: string;
  message: string;
  requiresClientResponse: boolean;
  clientResponded: boolean;
  createdAt: string;
}

export interface ExportInquiry {
  id: string;
  inquiryNumber: string;
  clientId: string;
  inquiryType: ExportInquiryType;
  status: ExportInquiryStatus;
  sourceChannel: string;
  destinationCountry: string;
  vehicleDescription: string;
  projectValue: number | null;
  estimatedDepartureDate: string | null;
  estimatedArrivalDate: string | null;
  notes: string;
  messages: ExportInquiryMessage[];
  linkedQuoteId: string | null;
  linkedQuoteNumber: string | null;
  linkedQuoteStatus: string | null;
  linkedExportJobId: string | null;
  linkedExportJobNumber: string | null;
  createdAt: string;
  updatedAt: string;
}
