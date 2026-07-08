import api from './api';
import type { AnalyticsDto } from '../types/analytics';

const USE_API = import.meta.env.VITE_USE_API === 'true';

export const analyticsService = {
  async getAnalytics(params: { from: string; to: string }): Promise<AnalyticsDto | null> {
    if (!USE_API) {
      return null;
    }

    const res = await api.get<AnalyticsDto>(`/analytics?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}`);
    return res.data;
  },
};
