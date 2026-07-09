import api from './api';
import type { ExportJob } from '../types/exportJob';

export interface ClientExportRequestPayload {
  destinationCountry: string;
  vehicleDescription: string;
  projectValue: number;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  notes?: string;
}

export interface ClientDocumentUploadPayload {
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: 'Compliance' | 'Shipping' | 'Customs' | 'Payment' | 'General';
  dataUrl?: string;
  fileUrl?: string;
}

export const clientPortalService = {
  async getMyJobs(): Promise<ExportJob[]> {
    const res = await api.get<ExportJob[]>('/client-portal/jobs');
    return res.data;
  },

  async submitRequest(payload: ClientExportRequestPayload): Promise<ExportJob> {
    const res = await api.post<ExportJob>('/client-portal/requests', payload);
    return res.data;
  },

  async uploadDocument(jobId: string, payload: ClientDocumentUploadPayload): Promise<ExportJob> {
    const res = await api.post<ExportJob>(`/client-portal/jobs/${jobId}/documents`, payload);
    return res.data;
  },
};
