import { http, HttpResponse, delay } from 'msw';
import type {
  BillQuoteResponse,
  BillSummaryResponse,
  PagedResult,
  CreateBillRequest,
  BillQuoteItemResponse,
} from '../../api/types';
import { seedStore } from '../seed';

export const billHandlers = [
  // POST /api/v1/bills
  http.post('/api/v1/bills', async ({ request }) => {
    const body = (await request.json()) as CreateBillRequest;
    const userId = seedStore.users[0].userID;
    const created = seedStore.createBill(body, userId);
    return HttpResponse.json(created, { status: 201 });
  }),

  // POST /api/v1/bills/quote
  http.post('/api/v1/bills/quote', async ({ request }) => {
    const body = (await request.json()) as CreateBillRequest;
    const items: BillQuoteItemResponse[] = body.items.map((item) => {
      const discountPct = item.discountPct ?? 0;
      const originalPrice = item.price;
      const discountAmount = Number(((originalPrice * discountPct) / 100).toFixed(2));
      const effectiveUnitPrice = originalPrice - discountAmount;
      const lineTotal = Number((effectiveUnitPrice * item.qty).toFixed(2));
      const gstRate = item.gstRate;
      const taxableAmount = Number((lineTotal / (1 + gstRate / 100)).toFixed(2));
      const gstAmount = Number((lineTotal - taxableAmount).toFixed(2));

      return {
        itemName: item.itemName,
        qty: item.qty,
        price: originalPrice,
        discountPct,
        originalPrice,
        discountAmount,
        taxableAmount,
        gstRate,
        gstAmount,
        lineTotal,
      };
    });

    const subtotal = Number(
      body.items.reduce((acc, i) => acc + i.price * i.qty, 0).toFixed(2)
    );
    const itemDiscounts = Number(
      items.reduce((acc, i) => acc + i.discountAmount * i.qty, 0).toFixed(2)
    );
    let total = Number((subtotal - itemDiscounts).toFixed(2));
    const isStrictModeBill = body.negotiatedTotal != null;

    if (body.negotiatedTotal != null) {
      total = body.negotiatedTotal;
    }

    const discount = Number((subtotal - total).toFixed(2));

    const quote: BillQuoteResponse = {
      subtotal,
      discount,
      total,
      negotiatedTotal: body.negotiatedTotal ?? null,
      isStrictModeBill,
      items,
    };

    return HttpResponse.json(quote, { status: 200 });
  }),

  // GET /api/v1/bills?page=&pageSize=&search=&shopID=&fromDate=&toDate=
  http.get('/api/v1/bills', async ({ request }) => {
    const url = new URL(request.url);
    const delayMs = parseInt(url.searchParams.get('_delay') || '400', 10);
    await delay(delayMs);
    const page = parseInt(url.searchParams.get('Page') || url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('PageSize') || url.searchParams.get('pageSize') || '50', 10);
    const search = (url.searchParams.get('Search') || url.searchParams.get('search') || '').toLowerCase().trim();
    const shopID = url.searchParams.get('ShopID') || url.searchParams.get('shopID');
    const fromDate = url.searchParams.get('FromDate') || url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('ToDate') || url.searchParams.get('toDate');
    const mode = url.searchParams.get('Mode') || url.searchParams.get('mode');
    const status = url.searchParams.get('Status') || url.searchParams.get('status');

    let filtered = [...seedStore.bills];

    if (shopID && shopID !== 'All') {
      filtered = filtered.filter((b) => b.shopID === shopID);
    }

    if (mode && mode !== 'All') {
      filtered = filtered.filter((b) =>
        b.payments.some((p) => p.mode.toLowerCase() === mode.toLowerCase())
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter((b) => b.isStrictModeBill ? status.toLowerCase() === 'strict' : status.toLowerCase() === 'paid');
    }

    if (search) {
      filtered = filtered.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(search) ||
          (b.customerName && b.customerName.toLowerCase().includes(search)) ||
          (b.customerPhone && b.customerPhone.includes(search))
      );
    }

    if (fromDate) {
      filtered = filtered.filter((b) => new Date(b.createdAt) >= new Date(fromDate));
    }

    if (toDate) {
      filtered = filtered.filter((b) => new Date(b.createdAt) <= new Date(toDate));
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (page - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const summaryItems: BillSummaryResponse[] = pageItems.map((b) => ({
      id: b.id,
      displayID: b.billNumber,
      primaryText: b.customerName ? `${b.customerName} (${b.billNumber})` : b.billNumber,
      secondaryText: b.customerPhone || `${b.items.length} items`,
      amount: b.total,
      statusBadge: 'Paid',
      createdAt: b.createdAt,
      tags: [b.payments[0]?.mode || 'Cash'],
    }));

    const result: PagedResult<BillSummaryResponse> = {
      items: summaryItems,
      totalCount,
      page,
      pageSize,
      totalPages,
      firstPage: 1,
      lastPage: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      isFirstPage: page === 1,
      isLastPage: page === totalPages,
    };

    return HttpResponse.json(result, { status: 200 });
  }),

  // GET /api/v1/bills/:id
  http.get('/api/v1/bills/:id', async ({ params }) => {
    const { id } = params;
    const bill = seedStore.bills.find((b) => b.id === id);
    if (!bill) {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const billReturns = seedStore.returns.filter(
      (r) =>
        (r as any).originalBillID === id ||
        (r as any).billID === id ||
        (r as any).billId === id
    );

    const itemsWithReturns = bill.items.map((it) => {
      const returnedQty = billReturns
        .filter((r) => r.type === 'Return')
        .filter((r) => r.itemName.toLowerCase() === it.itemName.toLowerCase())
        .reduce((sum, r) => sum + r.qty, 0);

      return {
        ...it,
        returnedQty,
      };
    });

    const enrichedBill = {
      ...bill,
      items: itemsWithReturns,
      returns: billReturns,
    };

    return HttpResponse.json(enrichedBill, { status: 200 });
  }),
];
