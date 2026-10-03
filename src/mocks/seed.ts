import type {
  BusinessesResponse,
  ShopResponse,
  UserProfileResponse,
  BillResponse,
  ReturnExchangeResponse,
  ReportSummaryResponse,
  CreateBillRequest,
  BillItemResponse,
  ReturnItemRequest,
  UpdateShopRequest,
} from '../api/types';
import {
  mockBusiness,
  mockShops,
  mockUsers,
  mockBills,
  mockReturns,
} from './fixtures/data';

class MockSeedStore {
  business: BusinessesResponse = {
    ...mockBusiness,
    strictBillingMode:
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_MOCK_STRICT === 'true',
  };

  shops: ShopResponse[] = JSON.parse(JSON.stringify(mockShops));
  users: UserProfileResponse[] = JSON.parse(JSON.stringify(mockUsers));
  bills: BillResponse[] = JSON.parse(JSON.stringify(mockBills));
  returns: ReturnExchangeResponse[] = JSON.parse(JSON.stringify(mockReturns));
  billSequence: number = 111;

  reset() {
    this.business = {
      ...mockBusiness,
      strictBillingMode:
        typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_MOCK_STRICT === 'true',
    };
    this.shops = JSON.parse(JSON.stringify(mockShops));
    this.users = JSON.parse(JSON.stringify(mockUsers));
    this.bills = JSON.parse(JSON.stringify(mockBills));
    this.returns = JSON.parse(JSON.stringify(mockReturns));
    this.billSequence = 111;
  }

  createBill(payload: CreateBillRequest, userId: string): BillResponse {
    const seq = this.billSequence++;
    const billNumber = `BILL-${String(seq).padStart(6, '0')}`;
    const id = `b1111111-0000-0000-0000-${String(seq).padStart(12, '0')}`;
    const createdAt = new Date().toISOString();

    const items: BillItemResponse[] = payload.items.map((item, index) => {
      const discountPct = item.discountPct ?? 0;
      const originalPrice = item.price;
      const discountAmount = Number(((originalPrice * discountPct) / 100).toFixed(2));
      const effectiveUnitPrice = originalPrice - discountAmount;
      const lineTotal = Number((effectiveUnitPrice * item.qty).toFixed(2));
      const gstRate = item.gstRate;
      const taxableAmount = Number((lineTotal / (1 + gstRate / 100)).toFixed(2));
      const gstAmount = Number((lineTotal - taxableAmount).toFixed(2));

      return {
        id: `item-${seq}-${index + 1}`,
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
      payload.items.reduce((acc, i) => acc + i.price * i.qty, 0).toFixed(2)
    );
    const itemDiscounts = Number(
      items.reduce((acc, i) => acc + i.discountAmount * i.qty, 0).toFixed(2)
    );
    let total = Number((subtotal - itemDiscounts).toFixed(2));
    const isStrictModeBill = payload.negotiatedTotal != null;

    if (payload.negotiatedTotal != null) {
      total = payload.negotiatedTotal;
    }

    const discount = Number((subtotal - total).toFixed(2));

    const payments = (payload.payments && payload.payments.length > 0)
      ? payload.payments.map((p, idx) => ({
          id: `pay-${seq}-${idx + 1}`,
          mode: p.mode,
          amount: p.amount,
        }))
      : [
          {
            id: `pay-${seq}-1`,
            mode: 'Cash',
            amount: total,
          },
        ];

    const newBill: BillResponse = {
      id,
      businessID: this.business.id,
      shopID: payload.shopID,
      billNumber,
      customerName: payload.customerName || null,
      customerPhone: payload.customerPhone || null,
      subtotal,
      discount,
      total,
      negotiatedTotal: payload.negotiatedTotal ?? null,
      isStrictModeBill,
      createdAt,
      createdByUserID: userId,
      items,
      payments,
    };

    // Prepend to list
    this.bills.unshift(newBill);
    return newBill;
  }

  addReturns(billId: string, items: ReturnItemRequest[], type: 'Return' | 'Exchange', userId: string): ReturnExchangeResponse[] {
    const bill = this.bills.find((b) => b.id === billId);
    if (!bill) throw new Error('Bill not found');

    const created: ReturnExchangeResponse[] = items.map((item, index) => {
      const retId = `ret-${Date.now()}-${index + 1}`;
      const record: ReturnExchangeResponse = {
        id: retId,
        originalBillID: billId,
        type,
        itemName: item.itemName,
        qty: item.qty,
        amount: item.amount,
        reason: item.reason ?? null,
        createdAt: new Date().toISOString(),
        createdByUserID: userId,
      };
      this.returns.unshift(record);
      return record;
    });

    return created;
  }

  updateShop(shopId: string, payload: UpdateShopRequest): ShopResponse {
    const index = this.shops.findIndex((s) => s.id === shopId);
    if (index === -1) throw new Error('Shop not found');

    const current = this.shops[index];
    const updated: ShopResponse = {
      ...current,
      name: payload.name ?? current.name,
      address: payload.address ?? current.address,
      mobile: payload.mobile ?? current.mobile,
      gst: payload.gst !== undefined ? payload.gst : current.gst,
      logoUrl: payload.logoUrl !== undefined ? payload.logoUrl : current.logoUrl,
      exchangePolicyDays: payload.exchangePolicyDays ?? current.exchangePolicyDays,
      receiptFooter: payload.receiptFooter !== undefined ? payload.receiptFooter : current.receiptFooter,
      printerType: payload.printerType !== undefined ? payload.printerType : current.printerType,
      printerName: payload.printerName !== undefined ? payload.printerName : current.printerName,
      whatsAppEnabled: payload.whatsAppEnabled ?? current.whatsAppEnabled,
      notificationEmail: payload.notificationEmail !== undefined ? payload.notificationEmail : current.notificationEmail,
      notificationSms: payload.notificationSms ?? current.notificationSms,
      updatedAt: new Date().toISOString(),
    };

    this.shops[index] = updated;
    return updated;
  }

  getReportSummary(shopId?: string | null, fromDate?: string | null, toDate?: string | null): ReportSummaryResponse {
    let filteredBills = [...this.bills];
    if (shopId) {
      filteredBills = filteredBills.filter((b) => b.shopID === shopId);
    }
    if (fromDate) {
      filteredBills = filteredBills.filter((b) => new Date(b.createdAt) >= new Date(fromDate));
    }
    if (toDate) {
      filteredBills = filteredBills.filter((b) => new Date(b.createdAt) <= new Date(toDate));
    }

    const totalSales = Number(filteredBills.reduce((acc, b) => acc + b.subtotal, 0).toFixed(2));
    const discounts = Number(filteredBills.reduce((acc, b) => acc + b.discount, 0).toFixed(2));
    const totalBills = filteredBills.length;

    let filteredReturns = [...this.returns];
    if (filteredBills.length > 0) {
      const validBillIds = new Set(filteredBills.map((b) => b.id));
      filteredReturns = filteredReturns.filter((r) => validBillIds.has(r.originalBillID));
    }
    const returnsAmount = Number(filteredReturns.reduce((acc, r) => acc + r.amount, 0).toFixed(2));
    const netSales = Number((totalSales - discounts - returnsAmount).toFixed(2));

    let cash = 0;
    let upi = 0;
    let card = 0;
    let gstCollected = 0;

    for (const b of filteredBills) {
      for (const p of b.payments) {
        if (p.mode.toLowerCase() === 'cash') cash += p.amount;
        else if (p.mode.toLowerCase() === 'upi') upi += p.amount;
        else if (p.mode.toLowerCase() === 'card') card += p.amount;
      }
      for (const it of b.items) {
        gstCollected += it.gstAmount ?? 0;
      }
    }

    return {
      fromDate: fromDate || '2026-09-01T00:00:00Z',
      toDate: toDate || '2026-09-30T23:59:59Z',
      totalSales,
      totalBills,
      discounts,
      returns: returnsAmount,
      netSales,
      cash: Number(cash.toFixed(2)),
      upi: Number(upi.toFixed(2)),
      card: Number(card.toFixed(2)),
      gstCollected: Number(gstCollected.toFixed(2)),
    };
  }
}

export const seedStore = new MockSeedStore();
