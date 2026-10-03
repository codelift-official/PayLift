import { http, HttpResponse } from 'msw';
import type {
  PrinterSettingsRequest,
  NotificationSettingsRequest,
  ReceiptSettingsRequest,
  CacheClearResult,
  CacheStatsResponse,
} from '../../api/types';
import { seedStore } from '../seed';

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
];
