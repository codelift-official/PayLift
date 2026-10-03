import { http, HttpResponse } from 'msw';
import type {
  ReceiptResponse,
  ReceiptItemResponse,
  GstLineResponse,
  ReceiptPaymentResponse,
  ThermalReceiptResponse,
  WhatsAppReceiptResponse,
} from '../../api/types';
import { seedStore } from '../seed';

export const receiptHandlers = [
  // GET /api/v1/bills/:id/receipt
  http.get('/api/v1/bills/:id/receipt', async ({ params }) => {
    const { id } = params;
    const bill = seedStore.bills.find((b) => b.id === id);
    if (!bill) {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const shop =
      seedStore.shops.find((s) => s.id === bill.shopID) || seedStore.shops[0];

    const items: ReceiptItemResponse[] = bill.items.map((it) => ({
      itemName: it.itemName,
      qty: it.qty,
      price: it.price,
      discountAmount: it.discountAmount * it.qty,
      taxableAmount: it.taxableAmount ?? 0,
      gstRate: it.gstRate,
      gstAmount: it.gstAmount ?? 0,
      lineTotal: it.lineTotal ?? it.price * it.qty,
    }));

    // GST breakup calculation
    const gstMap = new Map<number, { taxable: number; gst: number }>();
    for (const it of items) {
      const cur = gstMap.get(it.gstRate) || { taxable: 0, gst: 0 };
      cur.taxable += it.taxableAmount;
      cur.gst += it.gstAmount;
      gstMap.set(it.gstRate, cur);
    }

    const gstBreakup: GstLineResponse[] = Array.from(gstMap.entries()).map(
      ([rate, val]) => ({
        gstRate: rate,
        taxableAmount: Number(val.taxable.toFixed(2)),
        gstAmount: Number(val.gst.toFixed(2)),
      })
    );

    const payments: ReceiptPaymentResponse[] = bill.payments.map((p) => ({
      mode: p.mode,
      amount: p.amount,
    }));

    const dateObj = new Date(bill.createdAt);
    const billDate = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const billTime = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const receipt: ReceiptResponse = {
      shopName: shop.name,
      shopAddress: shop.address,
      shopMobile: shop.mobile,
      shopGST: shop.gst,
      shopLogoUrl: shop.logoUrl,
      billNumber: bill.billNumber,
      billDate,
      billTime,
      isStrictMode: bill.isStrictModeBill,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      items,
      subtotal: bill.subtotal,
      discount: bill.discount,
      total: bill.total,
      negotiatedTotal: bill.negotiatedTotal,
      gstBreakup,
      payments,
      exchangePolicyDays: shop.exchangePolicyDays,
      receiptFooter: shop.receiptFooter,
    };

    return HttpResponse.json(receipt, { status: 200 });
  }),

  // GET /api/v1/bills/:id/receipt/thermal?Width=58|80
  http.get('/api/v1/bills/:id/receipt/thermal', async ({ request, params }) => {
    const { id } = params;
    const bill = seedStore.bills.find((b) => b.id === id);
    if (!bill) {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const widthParam = url.searchParams.get('Width') || '58';
    const width = parseInt(widthParam, 10) === 80 ? 80 : 58;

    // Real ESC/POS bytes:
    // 0x1B, 0x40 (ESC @ - Initialize printer)
    // 0x1B, 0x61, 0x01 (ESC a 1 - Center align)
    // "Billify POS\n"
    // 0x1B, 0x61, 0x00 (ESC a 0 - Left align)
    // "Bill: " + bill.billNumber + "\n"
    // "Total: Rs." + bill.total + "\n"
    // 0x1D, 0x56, 0x00 (GS V 0 - Full Cut)
    const headerBytes = [0x1b, 0x40, 0x1b, 0x61, 0x01];
    const textBytes = Array.from(
      new TextEncoder().encode(
        `\n--- BILLIFY RECEIPT ---\n${bill.billNumber}\nTotal: Rs.${bill.total.toFixed(2)}\nThank You!\n\n\n`
      )
    );
    const cutBytes = [0x1d, 0x56, 0x00];
    const allBytes = new Uint8Array([
      ...headerBytes,
      ...textBytes,
      ...cutBytes,
    ]);

    // Base64 encode the Uint8Array
    let binary = '';
    for (let i = 0; i < allBytes.length; i++) {
      binary += String.fromCharCode(allBytes[i]);
    }
    const payload = btoa(binary);

    const response: ThermalReceiptResponse = {
      payload,
      encoding: 'base64',
      width,
    };

    return HttpResponse.json(response, { status: 200 });
  }),

  // GET /api/v1/bills/:id/receipt/whatsapp
  http.get('/api/v1/bills/:id/receipt/whatsapp', async ({ params }) => {
    const { id } = params;
    const bill = seedStore.bills.find((b) => b.id === id);
    if (!bill) {
      return HttpResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const shop =
      seedStore.shops.find((s) => s.id === bill.shopID) || seedStore.shops[0];
    const phone = bill.customerPhone ? bill.customerPhone.replace(/\D/g, '') : '';
    const itemsText = bill.items
      .map((it) => `• ${it.itemName} x${it.qty}: ₹${(it.lineTotal ?? it.price * it.qty).toFixed(2)}`)
      .join('\n');

    const message =
      `*Receipt from ${shop.name}*\n` +
      `Bill: ${bill.billNumber}\n` +
      `Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `${itemsText}\n\n` +
      `*Total: ₹${bill.total.toFixed(2)}*\n` +
      `${shop.receiptFooter || 'Thank you for your visit!'}`;

    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    const response: WhatsAppReceiptResponse = {
      message,
      waLink,
    };

    return HttpResponse.json(response, { status: 200 });
  }),
];
