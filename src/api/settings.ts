import { apiClient } from './client';
import type {
  ShopResponse,
  PrinterSettingsRequest,
  NotificationSettingsRequest,
  ReceiptSettingsRequest,
  CacheClearResult,
  CacheStatsResponse,
} from './types';

export const settingsApi = {
  updatePrinterSettings: async (
    shopID: string,
    payload: PrinterSettingsRequest
  ): Promise<ShopResponse> => {
    const res = await apiClient.put<ShopResponse>(
      `/api/v1/settings/printer/${shopID}`,
      payload
    );
    return res.data;
  },

  updateNotificationSettings: async (
    shopID: string,
    payload: NotificationSettingsRequest
  ): Promise<ShopResponse> => {
    const res = await apiClient.put<ShopResponse>(
      `/api/v1/settings/notifications/${shopID}`,
      payload
    );
    return res.data;
  },

  updateReceiptSettings: async (
    shopID: string,
    payload: ReceiptSettingsRequest
  ): Promise<ShopResponse> => {
    const res = await apiClient.put<ShopResponse>(
      `/api/v1/settings/receipt/${shopID}`,
      payload
    );
    return res.data;
  },

  clearCache: async (): Promise<CacheClearResult> => {
    const res = await apiClient.post<CacheClearResult>('/api/v1/cache/clear', {
      confirm: 'yes',
    });
    return res.data;
  },

  getCacheStats: async (): Promise<CacheStatsResponse> => {
    const res = await apiClient.get<CacheStatsResponse>('/api/v1/cache/stats');
    return res.data;
  },
};
