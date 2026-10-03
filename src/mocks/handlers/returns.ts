import { http, HttpResponse } from 'msw';
import type {
  ReturnSummaryResponse,
  PagedResult,
  CreateReturnRequest,
} from '../../api/types';
import { seedStore } from '../seed';

export const returnHandlers = [
  // POST /api/v1/bills/:id/returns
  http.post('/api/v1/bills/:id/returns', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as CreateReturnRequest;
    const userId = seedStore.users[0].userID;
    try {
      const created = seedStore.addReturns(id as string, body.items, 'Return', userId);
      return HttpResponse.json(created, { status: 201 });
    } catch {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
  }),

  // POST /api/v1/bills/:id/exchanges
  http.post('/api/v1/bills/:id/exchanges', async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as CreateReturnRequest;
    const userId = seedStore.users[0].userID;
    try {
      const created = seedStore.addReturns(id as string, body.items, 'Exchange', userId);
      return HttpResponse.json(created, { status: 201 });
    } catch {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }
  }),

  // GET /api/v1/bills/:id/returns
  http.get('/api/v1/bills/:id/returns', async ({ params }) => {
    const { id } = params;
    const returns = seedStore.returns.filter((r) => r.originalBillID === id);
    return HttpResponse.json(returns, { status: 200 });
  }),

  // GET /api/v1/returns
  http.get('/api/v1/returns', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const search = (url.searchParams.get('search') || '').toLowerCase().trim();
    const type = url.searchParams.get('type');

    let filtered = [...seedStore.returns];

    if (type && type !== 'All') {
      filtered = filtered.filter((r) => r.type.toLowerCase() === type.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.itemName.toLowerCase().includes(search) ||
          r.originalBillID.toLowerCase().includes(search) ||
          (r.reason && r.reason.toLowerCase().includes(search))
      );
    }

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (page - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    const summaryItems: ReturnSummaryResponse[] = pageItems.map((r) => {
      const origBill = seedStore.bills.find((b) => b.id === r.originalBillID);
      const billNum = origBill ? origBill.billNumber : r.originalBillID.slice(0, 8);
      return {
        id: r.id,
        displayID: `${billNum}-${r.type === 'Return' ? 'R' : 'E'}`,
        primaryText: `${r.itemName} (x${r.qty})`,
        secondaryText: r.reason || `Bill: ${billNum}`,
        amount: r.amount,
        statusBadge: r.type,
        createdAt: r.createdAt,
        tags: [r.type],
      };
    });

    const result: PagedResult<ReturnSummaryResponse> = {
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
];
