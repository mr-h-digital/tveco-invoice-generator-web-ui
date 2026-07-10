import api from './api';
import type { ExportInquiry, ExportInquiryStatus } from '../types/exportInquiry';
import type { ExportJob } from '../types/exportJob';

export interface AdminInquiryMessagePayload {
  message: string;
  requiresClientResponse?: boolean;
}

export const exportInquiryService = {
  async getInquiries(): Promise<ExportInquiry[]> {
    const res = await api.get<ExportInquiry[]>('/export-inquiries');
    return res.data;
  },

  async getInquiry(id: string): Promise<ExportInquiry> {
    const res = await api.get<ExportInquiry>(`/export-inquiries/${id}`);
    return res.data;
  },

  async addAdminMessage(id: string, payload: AdminInquiryMessagePayload): Promise<ExportInquiry> {
    const res = await api.post<ExportInquiry>(`/export-inquiries/${id}/messages`, payload);
    return res.data;
  },

  async updateStatus(id: string, status: ExportInquiryStatus): Promise<ExportInquiry> {
    const res = await api.patch<ExportInquiry>(`/export-inquiries/${id}/status`, { status });
    return res.data;
  },

  async convertToJob(id: string, quoteId: string): Promise<ExportJob> {
    const res = await api.post<ExportJob>(`/export-inquiries/${id}/convert-to-job`, { quoteId });
    return res.data;
  },
};
