import { apiClient } from './client';
import {
  CreateBillRequest,
  BillResponse,
  BillQuoteResponse,
  BillSummaryResponse,
  PagedResult,
} from './types';

export interface BillQueryFilters {
  shopID?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export const billsApi = {
  createBill: async (payload: CreateBillRequest): Promise<BillResponse> => {
    const res = await apiClient.post<BillResponse>('/api/v1/bills', payload);
    return res.data;
  },

  quoteBill: async (payload: CreateBillRequest): Promise<BillQuoteResponse> => {
    const res = await apiClient.post<BillQuoteResponse>('/api/v1/bills/quote', payload);
    return res.data;
  },

  getBills: async (params?: BillQueryFilters): Promise<PagedResult<BillSummaryResponse>> => {
    const res = await apiClient.get<PagedResult<BillSummaryResponse>>('/api/v1/bills', {
      params,
    });
    return res.data;
  },

  getBillById: async (id: string): Promise<BillResponse> => {
    const res = await apiClient.get<BillResponse>(`/api/v1/bills/${id}`);
    return res.data;
  },
};
