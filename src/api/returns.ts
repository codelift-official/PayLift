import { apiClient } from './client';
import type {
  ReturnExchangeResponse,
  ReturnSummaryResponse,
  PagedResult,
  CreateReturnRequest,
  ReturnGridQuery,
} from './types';

export const returnsApi = {
  createReturn: async (
    billId: string,
    payload: CreateReturnRequest
  ): Promise<ReturnExchangeResponse[]> => {
    const res = await apiClient.post<ReturnExchangeResponse[]>(
      `/api/v1/bills/${billId}/returns`,
      payload
    );
    return res.data;
  },

  createExchange: async (
    billId: string,
    payload: CreateReturnRequest
  ): Promise<ReturnExchangeResponse[]> => {
    const res = await apiClient.post<ReturnExchangeResponse[]>(
      `/api/v1/bills/${billId}/exchanges`,
      payload
    );
    return res.data;
  },

  getBillReturns: async (billId: string): Promise<ReturnExchangeResponse[]> => {
    const res = await apiClient.get<ReturnExchangeResponse[]>(
      `/api/v1/bills/${billId}/returns`
    );
    return res.data;
  },

  getReturns: async (
    params?: ReturnGridQuery
  ): Promise<PagedResult<ReturnSummaryResponse>> => {
    const res = await apiClient.get<PagedResult<ReturnSummaryResponse>>(
      '/api/v1/returns',
      { params }
    );
    return res.data;
  },
};
