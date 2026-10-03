import { http, HttpResponse } from 'msw';
import type {
  ShopResponse,
  CreateShopRequest,
  UpdateShopRequest,
} from '../../api/types';
import { seedStore } from '../seed';

export const shopHandlers = [
  // GET /api/v1/shops
  http.get('/api/v1/shops', async () => {
    return HttpResponse.json(seedStore.shops, { status: 200 });
  }),

  // GET /api/v1/shops/:id
  http.get('/api/v1/shops/:id', async ({ params }) => {
    const { id } = params;
    const shop = seedStore.shops.find((s) => s.id === id);
    if (!shop) {
      return HttpResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    return HttpResponse.json(shop, { status: 200 });
  }),

  // POST /api/v1/shops/setup
  http.post('/api/v1/shops/setup', async ({ request }) => {
    const body = (await request.json()) as CreateShopRequest;
    const newId = `shop-${Date.now()}`;
    const newShop: ShopResponse = {
      id: newId,
      businessID: seedStore.business.id,
      name: body.name,
      address: body.address,
      mobile: body.mobile,
      gst: body.gst || null,
      logoUrl: body.logoUrl || null,
      exchangePolicyDays: body.exchangePolicyDays ?? 7,
      receiptFooter: body.receiptFooter || null,
      printerType: body.printerType || 'Thermal',
      printerName: body.printerName || 'POS-58 Bluetooth',
      whatsAppEnabled: body.whatsAppEnabled ?? true,
      notificationEmail: body.notificationEmail || null,
      notificationSms: body.notificationSms ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    seedStore.shops.push(newShop);
    return HttpResponse.json(newShop, { status: 201 });
  }),

  // PUT /api/v1/shops/:id
  http.put('/api/v1/shops/:id', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as UpdateShopRequest;
    try {
      const updated = seedStore.updateShop(id as string, body);
      return HttpResponse.json(updated, { status: 200 });
    } catch {
      return HttpResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
  }),
];
