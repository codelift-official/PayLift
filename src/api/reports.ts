import { apiClient } from './client';
import { ReportSummaryResponse, ReportQuery } from './types';

export const reportsApi = {
  getSummary: async (query?: ReportQuery): Promise<ReportSummaryResponse> => {
    const res = await apiClient.get<ReportSummaryResponse>('/api/v1/reports/summary', {
      params: query,
    });
    return res.data;
  },
};
