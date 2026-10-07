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
    const body = (await request.json()) as any;
    const userId = seedStore.users[0]?.userID || 'user-1';
    try {
      const origBill = seedStore.bills.find((b) => b.id === id);
      if (!origBill) return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });

      // calculate prorated return value
      let totalReturnValue = 0;
      const returnedItems: any[] = [];
      const billDiscountPct = origBill.subtotal > 0 ? (origBill.discount / (origBill.originalSubtotal || origBill.subtotal)) : 0;

      for (const item of (body.returnItems || [])) {
        const billItem = origBill.items.find((bi) => bi.id === item.billItemId);
        if (billItem) {
          const itemNet = (billItem.lineTotal ?? (billItem.price * billItem.qty)) * (1 - billDiscountPct);
          const perUnit = itemNet / billItem.qty;
          const retVal = Math.round(perUnit * item.returnQty * 100) / 100;
          totalReturnValue += retVal;
          const retRecord = {
            id: `ret-${Date.now()}-${returnedItems.length}`,
            originalBillID: origBill.id,
            billItemID: billItem.id,
            productID: billItem.productID || null,
            itemName: billItem.itemName,
            qty: item.returnQty,
            amount: retVal,
            reason: item.reason || 'Exchange',
            type: 'Exchange' as const,
            status: 'Approved' as const,
            approvedByUserID: userId,
            createdByUserID: userId,
            createdAt: new Date().toISOString(),
          };
          returnedItems.push(retRecord);
          seedStore.returns.unshift(retRecord);
        }
      }

      // calculate new items total
      let newSubtotal = 0;
      const newBillItems: any[] = [];
      for (const ni of (body.newItems || [])) {
        let disc = 0;
        const lineGross = ni.unitPrice * ni.qty;
        if (ni.discountType === 'Percentage' && ni.discountValue) {
          disc = Math.round(((lineGross * ni.discountValue) / 100) * 100) / 100;
        } else if (ni.discountType === 'Amount' && ni.discountValue) {
          disc = Math.min(ni.discountValue * ni.qty, lineGross);
        }
        const lineNet = lineGross - disc;
        newSubtotal += lineNet;
        newBillItems.push({
          itemName: ni.productName,
          qty: ni.qty,
          price: ni.unitPrice,
          gstRate: ni.gstRate,
          productID: ni.productID || null,
          discountPct: lineGross > 0 ? (disc / lineGross) * 100 : 0,
          discountType: ni.discountType || null,
          discountValue: ni.discountValue || 0,
          discountAmount: disc,
          lineTotal: lineNet,
        });
      }

      let couponDiscount = 0;
      if (body.couponCodes && body.couponCodes.length > 0) {
        couponDiscount = Math.min(newSubtotal * 0.1, 100);
      }
      const newBillTotal = Math.max(0, newSubtotal - couponDiscount);
      const difference = Math.round((newBillTotal - totalReturnValue) * 100) / 100;
      const refundDue = difference < 0 ? Math.abs(difference) : 0;
      const extraPayable = difference > 0 ? difference : 0;

      // Create new bill
      const newBill = seedStore.createBill({
        shopID: origBill.shopID,
        customerName: origBill.customerName,
        customerPhone: origBill.customerPhone,
        items: newBillItems,
        payments: extraPayable > 0 ? [{ mode: body.paymentMode || 'Cash', amount: extraPayable }] : [],
      }, userId);

      const response = {
        exchangeBillId: newBill.id,
        originalBillId: origBill.id,
        returnValue: totalReturnValue,
        newSubtotal,
        newBillTotal,
        couponDiscount,
        difference,
        refundDue,
        extraPayable,
        returnedItems,
        newBill,
      };

      return HttpResponse.json(response, { status: 201 });
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
