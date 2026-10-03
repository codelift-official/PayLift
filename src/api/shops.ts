import { apiClient } from './client';
import { ShopResponse, CreateShopRequest, UpdateShopRequest } from './types';

export const shopsApi = {
  getShops: async (): Promise<ShopResponse[]> => {
    const res = await apiClient.get<ShopResponse[]>('/api/v1/shops');
    return res.data;
  },

  getShopById: async (shopId: string): Promise<ShopResponse> => {
    const res = await apiClient.get<ShopResponse>(`/api/v1/shops/${shopId}`);
    return res.data;
  },

  createShop: async (payload: CreateShopRequest): Promise<ShopResponse> => {
    const res = await apiClient.post<ShopResponse>('/api/v1/shops/setup', payload);
    return res.data;
  },

  updateShop: async (shopId: string, payload: UpdateShopRequest): Promise<ShopResponse> => {
    const res = await apiClient.put<ShopResponse>(`/api/v1/shops/${shopId}`, payload);
    return res.data;
  },
};
