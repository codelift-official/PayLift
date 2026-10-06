import { http, HttpResponse } from 'msw';
import type {
  InventorySettings,
  Product,
  ProductCategory,
  StockItem,
  StockMovement,
  Coupon,
  CouponSettings,
  Customer,
  Offer,
  PlatformTenantUsage,
  PlatformErrorLogItem,
} from '../../api/phase11';

// ─── Stateful in-memory stores ───────────────────────────────────

export const mockInventorySettings: InventorySettings = {
  inventoryModeEnabled: true,
  strictStockMode: true,
};

const getInitialCouponSettings = (): CouponSettings => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mockCouponSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return { allowCouponStacking: true };
};

export const mockCouponSettings: CouponSettings = getInitialCouponSettings();

export const mockProductCategories: ProductCategory[] = [
  { id: 'cat-1', name: 'Grains & Rice', displayOrder: 1 },
  { id: 'cat-2', name: 'Flour & Atta', displayOrder: 2 },
  { id: 'cat-3', name: 'Edible Oils', displayOrder: 3 },
  { id: 'cat-4', name: 'Spices & Salt', displayOrder: 4 },
  { id: 'cat-5', name: 'Packaged Food', displayOrder: 5 },
  { id: 'cat-6', name: 'Household & Cleaning', displayOrder: 6 },
  { id: 'cat-7', name: 'Snacks & Sweets', displayOrder: 7 },
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Basmati Rice 5kg',
    sku: 'RIC-501',
    category: 'Grains & Rice',
    unit: 'Pack',
    costPrice: 380,
    sellingPrice: 480,
    gstRate: 5,
    isActive: true,
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Aashirvaad Atta 10kg',
    sku: 'ATT-102',
    category: 'Flour & Atta',
    unit: 'Pack',
    costPrice: 420,
    sellingPrice: 500,
    gstRate: 0,
    isActive: true,
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Fortune Sunflower Oil 1L',
    sku: 'OIL-201',
    category: 'Edible Oils',
    unit: 'Ltr',
    costPrice: 110,
    sellingPrice: 140,
    gstRate: 5,
    isActive: true,
    createdAt: '2026-09-03T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Tata Salt 1kg',
    sku: 'SLT-001',
    category: 'Spices & Salt',
    unit: 'Pack',
    costPrice: 20,
    sellingPrice: 28,
    gstRate: 0,
    isActive: true,
    createdAt: '2026-09-04T10:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Maggi 2-Minute Noodles 4-Pack',
    sku: 'MAG-404',
    category: 'Packaged Food',
    unit: 'Pack',
    costPrice: 48,
    sellingPrice: 60,
    gstRate: 12,
    isActive: true,
    createdAt: '2026-09-05T10:00:00Z',
  },
  {
    id: 'prod-6',
    name: 'Surf Excel Detergent 1kg',
    sku: 'SRF-101',
    category: 'Household & Cleaning',
    unit: 'Pack',
    costPrice: 120,
    sellingPrice: 155,
    gstRate: 18,
    isActive: true,
    createdAt: '2026-09-06T10:00:00Z',
  },
  {
    id: 'prod-7',
    name: 'Cadbury Dairy Milk Silk 150g',
    sku: 'CHO-701',
    category: 'Snacks & Sweets',
    unit: 'Pcs',
    costPrice: 65,
    sellingPrice: 90,
    gstRate: 18,
    isActive: true,
    createdAt: '2026-09-07T10:00:00Z',
  },
  {
    id: 'prod-8',
    name: 'Tata Sampann Toor Dal 1kg',
    sku: 'DAL-301',
    category: 'Grains & Rice',
    unit: 'Kg',
    costPrice: 130,
    sellingPrice: 165,
    gstRate: 0,
    isActive: true,
    createdAt: '2026-09-08T10:00:00Z',
  },
];

export const mockStockItems: StockItem[] = [
  {
    id: 'stock-1',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-1',
    productName: 'Basmati Rice 5kg',
    sku: 'RIC-501',
    quantity: 8,
    unit: 'Pack',
    lowStockThreshold: 10,
    unitCost: 380,
    isLowStock: true, // Qty 8 <= 10 -> Low stock banner trigger
  },
  {
    id: 'stock-2',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-2',
    productName: 'Aashirvaad Atta 10kg',
    sku: 'ATT-102',
    quantity: 25,
    unit: 'Pack',
    lowStockThreshold: 5,
    unitCost: 420,
    isLowStock: false,
  },
  {
    id: 'stock-3',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-3',
    productName: 'Fortune Sunflower Oil 1L',
    sku: 'OIL-201',
    quantity: 4,
    unit: 'Ltr',
    lowStockThreshold: 10,
    unitCost: 110,
    isLowStock: true,
  },
  {
    id: 'stock-4',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-4',
    productName: 'Tata Salt 1kg',
    sku: 'SLT-001',
    quantity: 50,
    unit: 'Pack',
    lowStockThreshold: 15,
    unitCost: 20,
    isLowStock: false,
  },
  {
    id: 'stock-5',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-5',
    productName: 'Maggi 2-Minute Noodles 4-Pack',
    sku: 'MAG-404',
    quantity: 32,
    unit: 'Pack',
    lowStockThreshold: 10,
    unitCost: 48,
    isLowStock: false,
  },
  {
    id: 'stock-6',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-6',
    productName: 'Surf Excel Detergent 1kg',
    sku: 'SRF-101',
    quantity: 18,
    unit: 'Pack',
    lowStockThreshold: 8,
    unitCost: 120,
    isLowStock: false,
  },
  {
    id: 'stock-7',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-7',
    productName: 'Cadbury Dairy Milk Silk 150g',
    sku: 'CHO-701',
    quantity: 15,
    unit: 'Pcs',
    lowStockThreshold: 5,
    unitCost: 65,
    isLowStock: false,
  },
  {
    id: 'stock-8',
    shopId: '11111111-1111-1111-1111-111111111111',
    productId: 'prod-8',
    productName: 'Tata Sampann Toor Dal 1kg',
    sku: 'DAL-301',
    quantity: 22,
    unit: 'Kg',
    lowStockThreshold: 6,
    unitCost: 130,
    isLowStock: false,
  },
];

export const mockStockMovements: StockMovement[] = [
  {
    id: 'mov-1',
    timestamp: '2026-10-04T10:15:00Z',
    productId: 'prod-1',
    productName: 'Basmati Rice 5kg',
    type: 'Sale',
    qty: -2,
    balance: 8,
    by: 'Ravi Kumar',
    notes: 'Billed in BILL-000109',
  },
  {
    id: 'mov-2',
    timestamp: '2026-10-03T16:30:00Z',
    productId: 'prod-2',
    productName: 'Aashirvaad Atta 10kg',
    type: 'Purchase',
    qty: 15,
    balance: 25,
    by: 'Ramesh Sharma',
    notes: 'Direct distributor delivery #PO-941',
  },
  {
    id: 'mov-3',
    timestamp: '2026-10-02T11:45:00Z',
    productId: 'prod-3',
    productName: 'Fortune Sunflower Oil 1L',
    type: 'Adjust',
    qty: -1,
    balance: 4,
    by: 'Priya Sharma',
    notes: 'Damaged seal found during shelf check',
  },
  {
    id: 'mov-4',
    timestamp: '2026-10-01T09:20:00Z',
    productId: 'prod-4',
    productName: 'Tata Salt 1kg',
    type: 'Purchase',
    qty: 30,
    balance: 50,
    by: 'Ramesh Sharma',
    notes: 'Monthly bulk replenish',
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: 'coup-save10',
    code: 'SAVE10',
    description: '10% discount on order',
    discountType: 'Percentage',
    discountValue: 10,
    minOrderAmount: 100,
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    maxUses: 100,
    perCustomerLimit: 1,
    usedCount: 5,
    isActive: true,
  },
  {
    id: 'coup-welcome100',
    code: 'WELCOME100',
    description: 'Flat ₹100 instant discount',
    discountType: 'Amount',
    discountValue: 100,
    minOrderAmount: 200,
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    maxUses: 100,
    perCustomerLimit: 1,
    usedCount: 2,
    isActive: true,
  },
  {
    id: 'coup-1',
    code: 'WELCOME50',
    description: 'Flat ₹50 off on minimum purchase of ₹200',
    discountType: 'Amount',
    discountValue: 50,
    minOrderAmount: 200,
    validFrom: '2026-09-01T00:00:00Z',
    validTo: '2026-12-31T23:59:59Z',
    maxUses: 100,
    perCustomerLimit: 1,
    usedCount: 14,
    isActive: true,
  },
  {
    id: 'coup-2',
    code: 'FESTIVE10',
    description: '10% discount up to ₹200 on orders over ₹500',
    discountType: 'Percentage',
    discountValue: 10,
    minOrderAmount: 500,
    maxDiscountAmount: 200,
    validFrom: '2026-10-01T00:00:00Z',
    validTo: '2026-11-15T23:59:59Z',
    maxUses: 500,
    perCustomerLimit: 2,
    usedCount: 82,
    isActive: true,
  },
  {
    id: 'coup-3',
    code: 'SAVE100',
    description: '₹100 flat instant discount on orders above ₹1000',
    discountType: 'Amount',
    discountValue: 100,
    minOrderAmount: 1000,
    validFrom: '2026-09-15T00:00:00Z',
    validTo: '2026-10-31T23:59:59Z',
    maxUses: 50,
    perCustomerLimit: 1,
    usedCount: 12,
    isActive: true,
  },
  {
    id: 'coup-4',
    code: 'EXPIRED20',
    description: 'Expired seasonal promotional coupon',
    discountType: 'Amount',
    discountValue: 20,
    minOrderAmount: 100,
    validFrom: '2026-08-01T00:00:00Z',
    validTo: '2026-09-01T00:00:00Z',
    maxUses: 10,
    perCustomerLimit: 1,
    usedCount: 10,
    isActive: false,
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@gmail.com',
    totalBills: 12,
    totalSpend: 8450,
    avgBillValue: 704,
    lastVisit: '2026-10-02T11:20:00Z',
    notes: 'Prefers Basmati Rice and specific brand atta. Frequent weekend shopper.',
    recentBills: [
      { id: 'b-101', billNumber: 'INV-2026-001', date: '2026-10-02T11:20:00Z', amount: 980, status: 'Completed' },
      { id: 'b-94', billNumber: 'BILL-000094', date: '2026-09-24T18:15:00Z', amount: 1420, status: 'Completed' },
      { id: 'b-82', billNumber: 'BILL-000082', date: '2026-09-15T10:05:00Z', amount: 650, status: 'Completed' },
    ],
  },
  {
    id: 'cust-2',
    name: 'Pooja Hegde',
    phone: '9823456789',
    email: 'pooja.hegde@outlook.com',
    totalBills: 5,
    totalSpend: 3200,
    avgBillValue: 640,
    lastVisit: '2026-09-28T16:45:00Z',
    notes: 'Regular organic grocery buyer.',
    recentBills: [
      { id: 'b-98', billNumber: 'BILL-000098', date: '2026-09-28T16:45:00Z', amount: 760, status: 'Completed' },
      { id: 'b-75', billNumber: 'BILL-000075', date: '2026-09-10T14:30:00Z', amount: 1240, status: 'Completed' },
    ],
  },
  {
    id: 'cust-3',
    name: 'Amit Verma',
    phone: '9711223344',
    email: 'amit.verma@example.com',
    totalBills: 8,
    totalSpend: 6150,
    avgBillValue: 768,
    lastVisit: '2026-10-01T09:15:00Z',
    notes: 'Usually pays via UPI PhonePe.',
    recentBills: [
      { id: 'b-100', billNumber: 'BILL-000100', date: '2026-10-01T09:15:00Z', amount: 1120, status: 'Completed' },
      { id: 'b-89', billNumber: 'BILL-000089', date: '2026-09-20T19:00:00Z', amount: 890, status: 'Completed' },
    ],
  },
  {
    id: 'cust-4',
    name: 'Sunita Sharma',
    phone: '9898989898',
    email: 'sunita.sharma@yahoo.com',
    totalBills: 3,
    totalSpend: 1890,
    avgBillValue: 630,
    lastVisit: '2026-09-15T14:10:00Z',
    notes: 'Lives in local apartment block.',
    recentBills: [
      { id: 'b-83', billNumber: 'BILL-000083', date: '2026-09-15T14:10:00Z', amount: 630, status: 'Completed' },
    ],
  },
];

export const mockOffers: Offer[] = [
  {
    id: 'off-1',
    title: 'Festive Season Kickoff',
    body: 'Get 10% flat discount on all grains and cooking oils this weekend only at Kirana Mart!',
    validFrom: '2026-10-01T00:00:00Z',
    validTo: '2026-10-10T23:59:59Z',
    status: 'Sent',
    totalRecipients: 4,
    sentCount: 4,
    failedCount: 0,
    createdAt: '2026-10-01T10:00:00Z',
    recipients: [
      { id: 'rec-1', name: 'Rahul Sharma', phone: '9876543210', status: 'Sent', sentAt: '2026-10-01T10:05:00Z' },
      { id: 'rec-2', name: 'Priya Patel', phone: '9823456789', status: 'Sent', sentAt: '2026-10-01T10:05:00Z' },
      { id: 'rec-3', name: 'Amit Verma', phone: '9711223344', status: 'Sent', sentAt: '2026-10-01T10:05:00Z' },
      { id: 'rec-4', name: 'Sunita Sharma', phone: '9898989898', status: 'Sent', sentAt: '2026-10-01T10:05:00Z' },
    ],
  },
];

export const mockPlatformUsage: PlatformTenantUsage[] = [
  {
    tenantID: 1,
    tenantName: 'Kirana Supermart',
    bills30d: 428,
    users: 4,
    shops: 2,
    storage: '34.2 MB',
    api7d: 12450,
    lastActive: '2026-10-04T12:30:00Z',
    peakDay: '2026-09-28',
    avgPerDay: 14.2,
    activeUsers: 3,
    dailyBills: Array.from({ length: 30 }, (_, i) => ({
      date: `Sep ${i + 1}`,
      bills: Math.floor(10 + Math.sin(i) * 6 + (i % 5)),
    })),
  },
  {
    tenantID: 2,
    tenantName: 'Apex Electronics',
    bills30d: 890,
    users: 6,
    shops: 3,
    storage: '68.5 MB',
    api7d: 28900,
    lastActive: '2026-10-04T11:15:00Z',
    peakDay: '2026-10-02',
    avgPerDay: 29.6,
    activeUsers: 5,
    dailyBills: Array.from({ length: 30 }, (_, i) => ({
      date: `Sep ${i + 1}`,
      bills: Math.floor(25 + Math.cos(i) * 10 + (i % 7)),
    })),
  },
  {
    tenantID: 3,
    tenantName: 'Apex Supermart',
    bills30d: 1450,
    users: 12,
    shops: 5,
    storage: '124.0 MB',
    api7d: 54200,
    lastActive: '2026-10-04T13:40:00Z',
    peakDay: '2026-09-24',
    avgPerDay: 48.3,
    activeUsers: 10,
    dailyBills: Array.from({ length: 30 }, (_, i) => ({
      date: `Sep ${i + 1}`,
      bills: Math.floor(45 + Math.sin(i * 1.5) * 15 + (i % 8)),
    })),
  },
];

export const mockPlatformErrorLogs: PlatformErrorLogItem[] = [
  {
    id: 'err-1',
    time: '2026-10-04T13:42:15Z',
    status: 500,
    path: '/api/v1/bills/create',
    tenant: 'sharma-cloth',
    correlationID: 'c0a80101-7689-4b61-9c32-84918e7c1001',
    stackTrace: 'System.InvalidOperationException: Database deadlock detected during concurrent stock decrement.\n   at Billify.Core.Services.StockService.DecrementStockAsync(Guid shopId, List`1 items)\n   at Billify.Api.Controllers.BillsController.Create(CreateBillRequest req)',
  },
  {
    id: 'err-2',
    time: '2026-10-04T11:20:04Z',
    status: 404,
    path: '/api/v1/products/prod-999',
    tenant: 'gupta-sweets',
    correlationID: 'c0a80101-8123-4f12-8d99-52319f8b2002',
    stackTrace: 'Microsoft.AspNetCore.Http.BadHttpRequestException: Product with ID prod-999 was not found in catalog.\n   at Billify.Api.Controllers.ProductsController.GetById(String id)',
  },
  {
    id: 'err-3',
    time: '2026-10-04T08:14:50Z',
    status: 429,
    path: '/api/v1/whatsapp/send-receipt',
    tenant: 'apex-mart',
    correlationID: 'c0a80101-9452-4e88-bf14-38491a9d3003',
    stackTrace: 'Meta.GraphApi.RateLimitExceededException: User has exceeded the tier message threshold for 24h window.\n   at Billify.Infrastructure.WhatsApp.MetaCloudClient.SendTemplateAsync(String to, Object params)',
  },
];

// ─── MSW Handlers ────────────────────────────────────────────────

export const phase11Handlers = [
  // ── INVENTORY SETTINGS ──
  http.get('/business/inventory-settings', () => {
    return HttpResponse.json(mockInventorySettings);
  }),
  http.get('/api/v1/business/inventory-settings', () => {
    return HttpResponse.json(mockInventorySettings);
  }),
  http.put('/business/inventory-settings', async ({ request }) => {
    const body = (await request.json()) as Partial<InventorySettings>;
    if (typeof body.inventoryModeEnabled === 'boolean') {
      mockInventorySettings.inventoryModeEnabled = body.inventoryModeEnabled;
    }
    if (typeof body.strictStockMode === 'boolean') {
      mockInventorySettings.strictStockMode = body.strictStockMode;
    }
    return HttpResponse.json(mockInventorySettings);
  }),
  http.put('/api/v1/business/inventory-settings', async ({ request }) => {
    const body = (await request.json()) as Partial<InventorySettings>;
    if (typeof body.inventoryModeEnabled === 'boolean') {
      mockInventorySettings.inventoryModeEnabled = body.inventoryModeEnabled;
    }
    if (typeof body.strictStockMode === 'boolean') {
      mockInventorySettings.strictStockMode = body.strictStockMode;
    }
    return HttpResponse.json(mockInventorySettings);
  }),

  // ── PRODUCTS ──
  http.get('/products', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');
    const active = url.searchParams.get('active');

    let list = [...mockProducts];
    if (search) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
      );
    }
    if (category) {
      list = list.filter((p) => p.category === category);
    }
    if (active !== null && active !== undefined && active !== '') {
      const isActiveBool = active === 'true';
      list = list.filter((p) => p.isActive === isActiveBool);
    }
    return HttpResponse.json(list);
  }),
  http.get('/api/v1/products', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    let list = [...mockProducts];
    if (search) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search)
      );
    }
    return HttpResponse.json(list);
  }),
  http.get('/products/:id', ({ params }) => {
    const p = mockProducts.find((item) => item.id === params.id);
    if (!p) return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
    return HttpResponse.json(p);
  }),
  http.post('/products', async ({ request }) => {
    const body = (await request.json()) as Omit<Product, 'id'>;
    const newProduct: Product = {
      ...body,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    // Also create corresponding stock item
    mockStockItems.push({
      id: `stock-${Date.now()}`,
      shopId: '11111111-1111-1111-1111-111111111111',
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      quantity: 10,
      unit: newProduct.unit,
      lowStockThreshold: 5,
      unitCost: newProduct.costPrice,
      isLowStock: false,
    });
    return HttpResponse.json(newProduct, { status: 201 });
  }),
  http.post('/api/v1/products', async ({ request }) => {
    const body = (await request.json()) as Omit<Product, 'id'>;
    const newProduct: Product = {
      ...body,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    mockStockItems.push({
      id: `stock-${Date.now()}`,
      shopId: '11111111-1111-1111-1111-111111111111',
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      quantity: 10,
      unit: newProduct.unit,
      lowStockThreshold: 5,
      unitCost: newProduct.costPrice,
      isLowStock: false,
    });
    return HttpResponse.json(newProduct, { status: 201 });
  }),
  http.put('/products/:id', async ({ params, request }) => {
    const idx = mockProducts.findIndex((item) => item.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
    const body = (await request.json()) as Partial<Product>;
    mockProducts[idx] = { ...mockProducts[idx], ...body };
    return HttpResponse.json(mockProducts[idx]);
  }),
  http.put('/api/v1/products/:id', async ({ params, request }) => {
    const idx = mockProducts.findIndex((item) => item.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
    const body = (await request.json()) as Partial<Product>;
    mockProducts[idx] = { ...mockProducts[idx], ...body };
    return HttpResponse.json(mockProducts[idx]);
  }),
  http.post('/products/bulk', async ({ request }) => {
    const rawBody = (await request.json()) as any;
    const items = Array.isArray(rawBody) ? rawBody : (rawBody?.products || []);
    const imported: Product[] = [];
    for (const item of items) {
      const p: Product = {
        ...item,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      mockProducts.unshift(p);
      imported.push(p);
    }
    return HttpResponse.json({ importedCount: imported.length }, { status: 200 });
  }),
  http.post('/api/v1/products/bulk', async ({ request }) => {
    const rawBody = (await request.json()) as any;
    const items = Array.isArray(rawBody) ? rawBody : (rawBody?.products || []);
    const imported: Product[] = [];
    for (const item of items) {
      const p: Product = {
        ...item,
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      mockProducts.unshift(p);
      imported.push(p);
    }
    return HttpResponse.json({ importedCount: imported.length }, { status: 200 });
  }),

  // ── PRODUCT CATEGORIES ──
  http.get('/product-categories', () => {
    return HttpResponse.json(mockProductCategories);
  }),
  http.post('/product-categories', async ({ request }) => {
    const body = (await request.json()) as Omit<ProductCategory, 'id'>;
    const newCat: ProductCategory = {
      ...body,
      id: `cat-${Date.now()}`,
    };
    mockProductCategories.push(newCat);
    return HttpResponse.json(newCat, { status: 201 });
  }),
  http.put('/product-categories/:id', async ({ params, request }) => {
    const idx = mockProductCategories.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Category not found' }, { status: 404 });
    const body = (await request.json()) as Partial<ProductCategory>;
    mockProductCategories[idx] = { ...mockProductCategories[idx], ...body };
    return HttpResponse.json(mockProductCategories[idx]);
  }),
  http.delete('/product-categories/:id', ({ params }) => {
    const idx = mockProductCategories.findIndex((c) => c.id === params.id);
    if (idx !== -1) mockProductCategories.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  // ── STOCK ──
  http.get('/stock', ({ request }) => {
    const url = new URL(request.url);
    const lowStockOnly = url.searchParams.get('lowStockOnly') === 'true';
    let list = [...mockStockItems];
    if (lowStockOnly) {
      list = list.filter((s) => s.isLowStock || s.quantity <= s.lowStockThreshold);
    }
    return HttpResponse.json(list);
  }),
  http.post('/stock/adjust', async ({ request }) => {
    const body = (await request.json()) as { shopId: string; productId: string; newQuantity: number; notes?: string };
    const stock = mockStockItems.find((s) => s.productId === body.productId);
    if (!stock) return HttpResponse.json({ error: 'Stock record not found' }, { status: 404 });
    const diff = body.newQuantity - stock.quantity;
    stock.quantity = body.newQuantity;
    stock.isLowStock = stock.quantity <= stock.lowStockThreshold;

    mockStockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: stock.productId,
      productName: stock.productName,
      type: 'Adjust',
      qty: diff,
      balance: stock.quantity,
      by: 'Store Staff',
      notes: body.notes || 'Manual stock adjustment',
    });

    return HttpResponse.json(stock);
  }),
  http.post('/stock/purchase', async ({ request }) => {
    const body = (await request.json()) as { shopId: string; productId: string; addQuantity: number; costPrice?: number; notes?: string };
    const stock = mockStockItems.find((s) => s.productId === body.productId);
    if (!stock) return HttpResponse.json({ error: 'Stock record not found' }, { status: 404 });
    stock.quantity += Number(body.addQuantity);
    stock.isLowStock = stock.quantity <= stock.lowStockThreshold;
    if (body.costPrice) stock.unitCost = body.costPrice;

    mockStockMovements.unshift({
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: stock.productId,
      productName: stock.productName,
      type: 'Purchase',
      qty: Number(body.addQuantity),
      balance: stock.quantity,
      by: 'Store Staff',
      notes: body.notes || 'Stock purchase received',
    });

    return HttpResponse.json(stock);
  }),
  http.post('/stock/bulk-purchase', async ({ request }) => {
    const body = (await request.json()) as { shopId: string; items: Array<{ productId: string; qty: number; costPrice?: number }> };
    let count = 0;
    for (const item of body.items || []) {
      const stock = mockStockItems.find((s) => s.productId === item.productId);
      if (stock) {
        stock.quantity += Number(item.qty);
        stock.isLowStock = stock.quantity <= stock.lowStockThreshold;
        if (item.costPrice) stock.unitCost = item.costPrice;
        count++;
        mockStockMovements.unshift({
          id: `mov-${Date.now()}-${count}`,
          timestamp: new Date().toISOString(),
          productId: stock.productId,
          productName: stock.productName,
          type: 'Purchase',
          qty: Number(item.qty),
          balance: stock.quantity,
          by: 'Store Staff',
          notes: 'Bulk purchase',
        });
      }
    }
    return HttpResponse.json({ success: true, updatedCount: count });
  }),
  http.get('/stock/movements', ({ request }) => {
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    const type = url.searchParams.get('type');
    let list = [...mockStockMovements];
    if (productId) list = list.filter((m) => m.productId === productId);
    if (type) list = list.filter((m) => m.type.toLowerCase() === type.toLowerCase());
    return HttpResponse.json(list);
  }),

  // ── COUPONS & COUPON SETTINGS ──
  http.get('/coupons', () => {
    return HttpResponse.json(mockCoupons);
  }),
  http.get('/api/v1/coupons', () => {
    return HttpResponse.json(mockCoupons);
  }),
  http.get('/coupons/:id', ({ params }) => {
    const c = mockCoupons.find((item) => item.id === params.id || item.code.toUpperCase() === String(params.id).toUpperCase());
    if (!c) return HttpResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return HttpResponse.json(c);
  }),
  http.get('/api/v1/coupons/:id', ({ params }) => {
    const c = mockCoupons.find((item) => item.id === params.id || item.code.toUpperCase() === String(params.id).toUpperCase());
    if (!c) return HttpResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return HttpResponse.json(c);
  }),
  http.post('/coupons', async ({ request }) => {
    const body = (await request.json()) as Omit<Coupon, 'id' | 'usedCount'>;
    const newCoupon: Coupon = {
      ...body,
      id: `coup-${Date.now()}`,
      code: body.code.toUpperCase(),
      usedCount: 0,
    };
    mockCoupons.unshift(newCoupon);
    return HttpResponse.json(newCoupon, { status: 201 });
  }),
  http.post('/api/v1/coupons', async ({ request }) => {
    const body = (await request.json()) as Omit<Coupon, 'id' | 'usedCount'>;
    const newCoupon: Coupon = {
      ...body,
      id: `coup-${Date.now()}`,
      code: body.code.toUpperCase(),
      usedCount: 0,
    };
    mockCoupons.unshift(newCoupon);
    return HttpResponse.json(newCoupon, { status: 201 });
  }),
  http.put('/coupons/:id', async ({ params, request }) => {
    const idx = mockCoupons.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Coupon not found' }, { status: 404 });
    const body = (await request.json()) as Partial<Coupon>;
    if (body.code) body.code = body.code.toUpperCase();
    mockCoupons[idx] = { ...mockCoupons[idx], ...body };
    return HttpResponse.json(mockCoupons[idx]);
  }),
  http.put('/api/v1/coupons/:id', async ({ params, request }) => {
    const idx = mockCoupons.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Coupon not found' }, { status: 404 });
    const body = (await request.json()) as Partial<Coupon>;
    if (body.code) body.code = body.code.toUpperCase();
    mockCoupons[idx] = { ...mockCoupons[idx], ...body };
    return HttpResponse.json(mockCoupons[idx]);
  }),
  http.get('/business/coupon-settings', () => {
    return HttpResponse.json(mockCouponSettings);
  }),
  http.get('/api/v1/business/coupon-settings', () => {
    return HttpResponse.json(mockCouponSettings);
  }),
  http.put('/business/coupon-settings', async ({ request }) => {
    const body = (await request.json()) as Partial<CouponSettings>;
    if (typeof body.allowCouponStacking === 'boolean') {
      mockCouponSettings.allowCouponStacking = body.allowCouponStacking;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockCouponSettings', JSON.stringify(mockCouponSettings));
      }
    }
    return HttpResponse.json(mockCouponSettings);
  }),
  http.put('/api/v1/business/coupon-settings', async ({ request }) => {
    const body = (await request.json()) as Partial<CouponSettings>;
    if (typeof body.allowCouponStacking === 'boolean') {
      mockCouponSettings.allowCouponStacking = body.allowCouponStacking;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mockCouponSettings', JSON.stringify(mockCouponSettings));
      }
    }
    return HttpResponse.json(mockCouponSettings);
  }),
  http.post('/coupons/validate', async ({ request }) => {
    const { code, orderAmount } = (await request.json()) as { code: string; orderAmount: number };
    const upperCode = (code || '').trim().toUpperCase();
    const coupon = mockCoupons.find((c) => c.code.toUpperCase() === upperCode);

    if (!coupon) {
      return HttpResponse.json({ valid: false, discount: 0, reason: 'Invalid coupon code' }, { status: 200 });
    }
    if (!coupon.isActive) {
      return HttpResponse.json({ valid: false, discount: 0, reason: 'This coupon is no longer active' }, { status: 200 });
    }
    const now = new Date();
    if (coupon.validFrom) {
      const from = new Date(coupon.validFrom);
      if (from > now) {
        return HttpResponse.json({ valid: false, discount: 0, reason: 'Coupon is not yet active' }, { status: 200 });
      }
    }
    const expiryStr = coupon.validTo || (coupon as any).validUntil;
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      // Treat date-only string as end of day
      if (expiryStr.length <= 10) {
        expiry.setHours(23, 59, 59, 999);
      }
      if (expiry < now) {
        return HttpResponse.json({ valid: false, discount: 0, reason: 'Coupon has expired' }, { status: 200 });
      }
    }
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return HttpResponse.json({
        valid: false,
        discount: 0,
        reason: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      }, { status: 200 });
    }

    let discount = 0;
    if (coupon.discountType === 'Amount') {
      discount = Math.min(orderAmount, coupon.discountValue);
    } else {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }

    return HttpResponse.json({
      valid: true,
      discount: Math.round(discount * 100) / 100,
      coupon,
    });
  }),
  http.post('/api/v1/coupons/validate', async ({ request }) => {
    const { code, orderAmount } = (await request.json()) as { code: string; orderAmount: number };
    const upperCode = (code || '').trim().toUpperCase();
    const coupon = mockCoupons.find((c) => c.code.toUpperCase() === upperCode);

    if (!coupon) {
      return HttpResponse.json({ valid: false, discount: 0, reason: 'Invalid coupon code' }, { status: 200 });
    }
    if (!coupon.isActive) {
      return HttpResponse.json({ valid: false, discount: 0, reason: 'This coupon is no longer active' }, { status: 200 });
    }
    const now = new Date();
    if (coupon.validFrom) {
      const from = new Date(coupon.validFrom);
      if (from > now) {
        return HttpResponse.json({ valid: false, discount: 0, reason: 'Coupon is not yet active' }, { status: 200 });
      }
    }
    const expiryStr = coupon.validTo || (coupon as any).validUntil;
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      if (expiryStr.length <= 10) {
        expiry.setHours(23, 59, 59, 999);
      }
      if (expiry < now) {
        return HttpResponse.json({ valid: false, discount: 0, reason: 'Coupon has expired' }, { status: 200 });
      }
    }
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return HttpResponse.json({
        valid: false,
        discount: 0,
        reason: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
      }, { status: 200 });
    }

    let discount = 0;
    if (coupon.discountType === 'Amount') {
      discount = Math.min(orderAmount, coupon.discountValue);
    } else {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }

    return HttpResponse.json({
      valid: true,
      discount: Math.round(discount * 100) / 100,
      coupon,
    });
  }),

  // ── CUSTOMERS ──
  http.get('/customers', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    let list = [...mockCustomers];
    if (search) {
      list = list.filter((c) => c.name.toLowerCase().includes(search) || c.phone.includes(search));
    }
    return HttpResponse.json(list);
  }),
  http.get('/customers/:id', ({ params }) => {
    const c = mockCustomers.find((item) => item.id === params.id);
    if (!c) return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    return HttpResponse.json(c);
  }),
  http.post('/customers', async ({ request }) => {
    const body = (await request.json()) as Partial<Customer>;
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: body.name || 'New Customer',
      phone: body.phone || '',
      email: body.email,
      totalBills: 0,
      totalSpend: 0,
      avgBillValue: 0,
      lastVisit: new Date().toISOString(),
      notes: body.notes,
      recentBills: [],
    };
    mockCustomers.unshift(newCustomer);
    return HttpResponse.json(newCustomer, { status: 201 });
  }),
  http.put('/customers/:id', async ({ params, request }) => {
    const idx = mockCustomers.findIndex((item) => item.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Customer not found' }, { status: 404 });
    const body = (await request.json()) as Partial<Customer>;
    mockCustomers[idx] = { ...mockCustomers[idx], ...body };
    return HttpResponse.json(mockCustomers[idx]);
  }),
  http.delete('/customers/:id', ({ params }) => {
    const idx = mockCustomers.findIndex((c) => c.id === params.id);
    if (idx !== -1) mockCustomers.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  // ── OFFERS ──
  http.get('/offers', () => {
    return HttpResponse.json(mockOffers);
  }),
  http.get('/offers/:id', ({ params }) => {
    const off = mockOffers.find((item) => item.id === params.id);
    if (!off) return HttpResponse.json({ error: 'Offer not found' }, { status: 404 });
    return HttpResponse.json(off);
  }),
  http.post('/offers', async ({ request }) => {
    const body = (await request.json()) as { title: string; body: string; validFrom?: string; validTo?: string; sendNow?: boolean };
    const recipients = mockCustomers.map((c, i) => ({
      id: `rec-${Date.now()}-${i}`,
      name: c.name,
      phone: c.phone,
      status: (body.sendNow ? 'Sent' : 'Pending') as 'Sent' | 'Failed' | 'Pending',
      sentAt: body.sendNow ? new Date().toISOString() : undefined,
    }));
    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      title: body.title,
      body: body.body,
      validFrom: body.validFrom,
      validTo: body.validTo,
      status: body.sendNow ? 'Sent' : 'Draft',
      totalRecipients: recipients.length,
      sentCount: body.sendNow ? recipients.length : 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
      recipients,
    };
    mockOffers.unshift(newOffer);
    return HttpResponse.json(newOffer, { status: 201 });
  }),
  http.post('/offers/:id/send', ({ params }) => {
    const off = mockOffers.find((item) => item.id === params.id);
    if (!off) return HttpResponse.json({ error: 'Offer not found' }, { status: 404 });
    off.status = 'Sent';
    off.sentCount = off.totalRecipients;
    off.recipients?.forEach((r) => {
      r.status = 'Sent';
      r.sentAt = new Date().toISOString();
    });
    return HttpResponse.json(off);
  }),
  http.post('/offers/:id/retry', ({ params }) => {
    const off = mockOffers.find((item) => item.id === params.id);
    if (!off) return HttpResponse.json({ error: 'Offer not found' }, { status: 404 });
    off.failedCount = 0;
    off.recipients?.forEach((r) => {
      if (r.status === 'Failed') {
        r.status = 'Sent';
        r.sentAt = new Date().toISOString();
      }
    });
    off.status = 'Sent';
    return HttpResponse.json(off);
  }),

  // ── PLATFORM USAGE & ERROR LOG ──
  http.get('/platform/usage', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.includes('trigger-401')) {
      return new HttpResponse(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return HttpResponse.json(mockPlatformUsage);
  }),
  http.get('/platform/usage/:id', ({ params }) => {
    const item = mockPlatformUsage.find((u) => String(u.tenantID) === String(params.id));
    if (!item) return HttpResponse.json(mockPlatformUsage[0]);
    return HttpResponse.json(item);
  }),
  http.get('/platform/error-log', ({ request }) => {
    const url = new URL(request.url);
    const tenant = url.searchParams.get('tenant');
    const status = url.searchParams.get('status');
    let list = [...mockPlatformErrorLogs];
    if (tenant) list = list.filter((e) => e.tenant.toLowerCase().includes(tenant.toLowerCase()));
    if (status) list = list.filter((e) => String(e.status) === String(status));
    return HttpResponse.json(list);
  }),
];
