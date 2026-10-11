import { http, HttpResponse } from 'msw';
import type {
  PrinterSettingsRequest,
  NotificationSettingsRequest,
  ReceiptSettingsRequest,
  CacheClearResult,
  CacheStatsResponse,
} from '../../api/types';
import { seedStore } from '../seed';

let mockPlatformSettings: Record<string, string> = {
  DefaultTrialDays: '30',
  DefaultGraceDays: '7',
  MaxGraceDays: '90',
  MaxTrialDays: '180',
  OverdueSuspendAfterDays: '15',
  DisablePublicBusinessSignup: 'false',
};

const getStoredPlatformSettings = () => {
  try {
    const s = localStorage.getItem('mock_platform_settings');
    if (s) return JSON.parse(s);
  } catch {}
  return mockPlatformSettings;
};

const saveStoredPlatformSettings = (data: Record<string, string>) => {
  mockPlatformSettings = { ...mockPlatformSettings, ...data };
  try {
    localStorage.setItem('mock_platform_settings', JSON.stringify(mockPlatformSettings));
  } catch {}
};

let mockBusinessSettings: Record<string, any> = {
  InventoryModeEnabled: 'false',
  StrictStockMode: 'false',
  AllowCouponStacking: 'false',
  StrictBillingMode: 'false',
};

const getStoredBusinessSettings = () => {
  try {
    const s = localStorage.getItem('mock_business_settings');
    if (s) return JSON.parse(s);
  } catch {}
  return mockBusinessSettings;
};

const saveStoredBusinessSettings = (data: Record<string, any>) => {
  mockBusinessSettings = { ...mockBusinessSettings, ...data };
  try {
    localStorage.setItem('mock_business_settings', JSON.stringify(mockBusinessSettings));
  } catch {}
};

let mockShopSettings: Record<string, any> = {
  CustomerRecommendEnabled: 'true',
  CustomerMandatory: 'false',
  DiscountMode: 'flat',
  ProductSource: 'both',
  DefaultGstRate: '18',
  PricesIncludeGst: 'false',
  RoundingMode: 'round',
  CouponStackingEnabled: 'false',
  ExchangePolicyDays: '14',
  ReceiptFooter: 'Thank you for shopping with us!',
  PrinterType: 'Thermal',
  PrinterName: '',
  WhatsAppEnabled: 'false',
  NotificationEmail: '',
  NotificationSms: 'false',
};

const getStoredShopSettings = () => {
  try {
    const s = localStorage.getItem('mock_shop_settings');
    if (s) return JSON.parse(s);
  } catch {}
  return mockShopSettings;
};

const saveStoredShopSettings = (data: Record<string, any>) => {
  mockShopSettings = { ...mockShopSettings, ...data };
  try {
    localStorage.setItem('mock_shop_settings', JSON.stringify(mockShopSettings));
  } catch {}
};

export const settingsHandlers = [
  // PUT /api/v1/settings/printer/:shopID
  http.put('/api/v1/settings/printer/:shopID', async ({ params, request }) => {
    const { shopID } = params;
    const body = (await request.json()) as PrinterSettingsRequest;
    try {
      const updated = seedStore.updateShop(shopID as string, {
        name: undefined as any,
        address: undefined as any,
        mobile: undefined as any,
        printerType: body.printerType,
        printerName: body.printerName,
      });
      return HttpResponse.json(updated, { status: 200 });
    } catch {
      return HttpResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
  }),

  // PUT /api/v1/settings/notifications/:shopID
  http.put('/api/v1/settings/notifications/:shopID', async ({ params, request }) => {
    const { shopID } = params;
    const body = (await request.json()) as NotificationSettingsRequest;
    try {
      const updated = seedStore.updateShop(shopID as string, {
        name: undefined as any,
        address: undefined as any,
        mobile: undefined as any,
        whatsAppEnabled: body.whatsAppEnabled,
        notificationEmail: body.notificationEmail,
        notificationSms: body.notificationSms,
      });
      return HttpResponse.json(updated, { status: 200 });
    } catch {
      return HttpResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
  }),

  // PUT /api/v1/settings/receipt/:shopID
  http.put('/api/v1/settings/receipt/:shopID', async ({ params, request }) => {
    const { shopID } = params;
    const body = (await request.json()) as ReceiptSettingsRequest;
    try {
      const updated = seedStore.updateShop(shopID as string, {
        name: undefined as any,
        address: undefined as any,
        mobile: undefined as any,
        exchangePolicyDays: body.exchangePolicyDays,
        receiptFooter: body.receiptFooter,
      });
      return HttpResponse.json(updated, { status: 200 });
    } catch {
      return HttpResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
  }),

  // POST /api/v1/cache/clear
  http.post('/api/v1/cache/clear', async () => {
    const res: CacheClearResult = {
      cleared: true,
      tenantID: seedStore.business.id,
      keysRemoved: 14,
    };
    return HttpResponse.json(res, { status: 200 });
  }),

  // GET /api/v1/cache/stats
  http.get('/api/v1/cache/stats', async () => {
    const res: CacheStatsResponse = {
      tenantKeys: 32,
      gridBillsKeys: 12,
      gridReturnsKeys: 4,
      gridReportsKeys: 6,
    };
    return HttpResponse.json(res, { status: 200 });
  }),

  // GET Platform Settings
  http.get('*/platform/settings', async () => {
    return HttpResponse.json(getStoredPlatformSettings());
  }),
  http.get('/platform/settings', async () => {
    return HttpResponse.json(getStoredPlatformSettings());
  }),

  // PUT Platform Settings
  http.put('*/platform/settings', async ({ request }) => {
    const body = (await request.json()) as { key: string; value: string };
    if (body.key) {
      saveStoredPlatformSettings({ [body.key]: String(body.value) });
    }
    return HttpResponse.json({ success: true, key: body.key, value: body.value });
  }),
  http.put('/platform/settings', async ({ request }) => {
    const body = (await request.json()) as { key: string; value: string };
    if (body.key) {
      saveStoredPlatformSettings({ [body.key]: String(body.value) });
    }
    return HttpResponse.json({ success: true, key: body.key, value: body.value });
  }),

  // GET Business Settings
  http.get('*/api/v1/business/settings', async () => {
    return HttpResponse.json(getStoredBusinessSettings());
  }),
  http.get('/api/v1/business/settings', async () => {
    return HttpResponse.json(getStoredBusinessSettings());
  }),
  http.get('*/business/settings', async () => {
    return HttpResponse.json(getStoredBusinessSettings());
  }),

  // PUT Business Settings
  http.put('*/api/v1/business/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredBusinessSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredBusinessSettings(body);
    }
    return HttpResponse.json(getStoredBusinessSettings());
  }),
  http.put('/api/v1/business/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredBusinessSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredBusinessSettings(body);
    }
    return HttpResponse.json(getStoredBusinessSettings());
  }),
  http.put('*/business/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredBusinessSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredBusinessSettings(body);
    }
    return HttpResponse.json(getStoredBusinessSettings());
  }),

  // GET Shop Settings
  http.get('*/api/v1/shops/:shopID/settings', async () => {
    return HttpResponse.json(getStoredShopSettings());
  }),
  http.get('/api/v1/shops/:shopID/settings', async () => {
    return HttpResponse.json(getStoredShopSettings());
  }),
  http.get('*/shops/:shopID/settings', async () => {
    return HttpResponse.json(getStoredShopSettings());
  }),

  // PUT Shop Settings
  http.put('*/api/v1/shops/:shopID/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredShopSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredShopSettings(body);
    }
    return HttpResponse.json(getStoredShopSettings());
  }),
  http.put('/api/v1/shops/:shopID/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredShopSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredShopSettings(body);
    }
    return HttpResponse.json(getStoredShopSettings());
  }),
  http.put('*/shops/:shopID/settings', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body.key !== undefined) {
      saveStoredShopSettings({ [body.key]: String(body.value) });
    } else {
      saveStoredShopSettings(body);
    }
    return HttpResponse.json(getStoredShopSettings());
  }),
];
