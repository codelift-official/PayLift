import { apiClient } from './client';
import { platformApiClient } from '../platform/api/client';

export interface WhatsAppConfig {
  id?: string;
  shopId: string;
  phoneNumberId: string;
  wabaId?: string;
  accessToken?: string;
  hasAccessToken?: boolean;
  verifyToken: string;
  isActive: boolean;
}

export interface WhatsAppUsage {
  sentThisMonth: number;
  monthlyLimit: number;
  allTimeSent: number;
  failedCount: number;
}

export interface WhatsAppMessage {
  id: string;
  recipient: string;
  type: 'text' | 'template';
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  content: string;
  error?: string | null;
}

export interface SendWhatsAppPayload {
  shopId: string;
  recipientPhone: string;
  type: 'text' | 'template';
  text?: string;
  template?: {
    name: string;
    language: string;
    params: string[];
  };
}

export interface PlatformWhatsAppTenant {
  tenantId: string;
  tenantName: string;
  shopId: string;
  shopName: string;
  phoneNumberId: string;
  isActive: boolean;
  sentThisMonth: number;
  monthlyLimit: number;
  allTimeSent: number;
  failedCount: number;
  lastSentAt: string;
}

export const whatsappApi = {
  getConfig: async (shopId: string): Promise<WhatsAppConfig> => {
    try {
      const res = await apiClient.get(`/api/v1/whatsapp/config/${shopId}`);
      const d = res.data;
      return {
        id: d.id,
        shopId: d.shopID || shopId,
        phoneNumberId: d.phoneNumberID || d.phoneNumberId || '',
        wabaId: d.wabaID || d.wabaId || '',
        accessToken: d.accessTokenMasked || d.accessToken || '',
        hasAccessToken: Boolean(d.accessTokenMasked || d.accessToken),
        verifyToken: d.verifyToken || '',
        isActive: Boolean(d.isActive),
      };
    } catch (err: any) {
      if (err.response?.status === 404) {
        return {
          shopId,
          phoneNumberId: '',
          verifyToken: '',
          isActive: false,
          hasAccessToken: false,
        };
      }
      throw err;
    }
  },

  saveConfig: async (config: WhatsAppConfig): Promise<WhatsAppConfig> => {
    const payload = {
      phoneNumberId: config.phoneNumberId,
      wabaId: config.wabaId || undefined,
      accessToken: config.accessToken,
      verifyToken: config.verifyToken,
      isActive: config.isActive,
    };
    const res = await apiClient.post(`/api/v1/whatsapp/config/${config.shopId}`, payload);
    const d = res.data;
    return {
      id: d.id,
      shopId: d.shopID || config.shopId,
      phoneNumberId: d.phoneNumberID || config.phoneNumberId,
      wabaId: d.wabaID || config.wabaId,
      accessToken: d.accessTokenMasked || config.accessToken,
      hasAccessToken: true,
      verifyToken: d.verifyToken || config.verifyToken,
      isActive: Boolean(d.isActive),
    };
  },

  testConnection: async (data: { shopId: string; recipientPhone: string }): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post(`/api/v1/whatsapp/config/${data.shopId}/test`, {
      testPhone: data.recipientPhone,
    });
    return {
      success: res.data?.success ?? true,
      message: res.data?.message || 'Test signal sent successfully',
    };
  },

  getUsage: async (shopId: string): Promise<WhatsAppUsage> => {
    try {
      const res = await apiClient.get(`/api/v1/whatsapp/usage/${shopId}`);
      const d = res.data;
      const cur = d.currentMonth || {};
      const all = d.allTime || {};
      return {
        sentThisMonth: (cur.serviceMessagesSent || 0) + (cur.templateMessagesSent || 0),
        monthlyLimit: cur.limit || 1000,
        allTimeSent: (all.serviceMessagesSent || 0) + (all.templateMessagesSent || 0),
        failedCount: all.failedCount || 0,
      };
    } catch {
      return {
        sentThisMonth: 0,
        monthlyLimit: 1000,
        allTimeSent: 0,
        failedCount: 0,
      };
    }
  },

  getMessages: async (params: { shopId: string; status?: string; startDate?: string; endDate?: string }): Promise<WhatsAppMessage[]> => {
    try {
      const res = await apiClient.get(`/api/v1/whatsapp/messages/${params.shopId}`, {
        params: { status: params.status, startDate: params.startDate, endDate: params.endDate },
      });
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch {
      return [];
    }
  },

  sendMessage: async (payload: SendWhatsAppPayload): Promise<{ success: boolean; messageId: string }> => {
    const res = await apiClient.post(`/api/v1/whatsapp/send`, payload);
    return res.data;
  },

  getPlatformTenants: async (): Promise<PlatformWhatsAppTenant[]> => {
    try {
      const res = await platformApiClient.get('/platform/whatsapp/tenants');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    } catch {
      return [];
    }
  },

  disablePlatformShop: async (shopId: string): Promise<{ success: boolean }> => {
    const res = await platformApiClient.post(`/platform/whatsapp/shops/${shopId}/disable`);
    return res.data;
  },
};
