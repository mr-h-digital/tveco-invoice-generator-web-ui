import api from './api';
import type { ExportJob } from '../types/exportJob';
import type { ExportInquiry } from '../types/exportInquiry';
import type { Quote } from '../types/quote';

export interface ClientExportInquiryPayload {
  inquiryType: 'INQUIRY' | 'REQUEST';
  destinationCountry: string;
  vehicleDescription: string;
  projectValue?: number;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  notes?: string;
}

export const clientPortalService = {
  async getMyJobs(): Promise<ExportJob[]> {
    const res = await api.get<ExportJob[]>('/client-portal/jobs');
    return res.data;
  },

  async getMyInquiries(): Promise<ExportInquiry[]> {
    const res = await api.get<ExportInquiry[]>('/client-portal/inquiries');
    return res.data;
  },

  async submitInquiry(payload: ClientExportInquiryPayload): Promise<ExportInquiry> {
    const res = await api.post<ExportInquiry>('/client-portal/inquiries', payload);
    return res.data;
  },

  async respondToInquiry(inquiryId: string, message: string): Promise<ExportInquiry> {
    const res = await api.post<ExportInquiry>(`/client-portal/inquiries/${inquiryId}/responses`, { message });
    return res.data;
  },

  async getMyQuotes(): Promise<Quote[]> {
    const res = await api.get<Quote[]>('/client-portal/quotes');
    return res.data;
  },

  async decideQuote(quoteId: string, status: 'ACCEPTED' | 'DECLINED', note?: string): Promise<Quote> {
    const res = await api.post<Quote>(`/client-portal/quotes/${quoteId}/decision`, { status, note });
    return res.data;
  },
};
