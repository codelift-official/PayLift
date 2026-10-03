import { apiClient } from './client';
import type {
  ReceiptResponse,
  ThermalReceiptResponse,
  WhatsAppReceiptResponse,
} from './types';

export const receiptsApi = {
  getReceipt: async (billId: string): Promise<ReceiptResponse> => {
    const res = await apiClient.get<ReceiptResponse>(`/api/v1/bills/${billId}/receipt`);
    return res.data;
  },

  getThermalReceipt: async (
    billId: string,
    width: 58 | 80 = 58
  ): Promise<ThermalReceiptResponse> => {
    const res = await apiClient.get<ThermalReceiptResponse>(
      `/api/v1/bills/${billId}/receipt/thermal`,
      {
        params: { Width: width },
      }
    );
    return res.data;
  },

  getWhatsAppReceipt: async (billId: string): Promise<WhatsAppReceiptResponse> => {
    const res = await apiClient.get<WhatsAppReceiptResponse>(
      `/api/v1/bills/${billId}/receipt/whatsapp`
    );
    return res.data;
  },
};
