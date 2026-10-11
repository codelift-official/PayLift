import { http, HttpResponse } from 'msw';

export const mockBusinesses = [
  {
    id: '1',
    name: 'Sharma Cloth Emporium',
    slug: 'sharma-cloth',
    tier: 'Pro',
    status: 'Active',
    trialEndsAt: null,
    graceEndsAt: null,
    daysLeft: 0,
    suspendedReason: null,
    graceDaysGranted: 0,
    graceGrantCount: 0,
    lastGraceGrantedBy: null,
    lastGraceGrantedAt: null,
    ownerEmail: 'sharma@example.com',
    gst: '07AAAAA0000A1Z5',
    createdAt: '2026-09-01T10:00:00Z',
    shops: [
      {
        id: 's1',
        name: 'Main Branch - Chandni Chowk',
        address: 'Shop 12, Main Market',
        mobile: '9876543210',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ],
    users: [
      {
        id: 'u1',
        name: 'Ramesh Sharma',
        email: 'sharma@example.com',
        role: 'BusinessAdmin',
        createdAt: '2026-09-01T10:00:00Z',
      },
    ],
  },
  {
    id: '2',
    name: 'Gupta Sweets & Bakers',
    slug: 'gupta-sweets',
    tier: 'Starter',
    status: 'Trial',
    trialEndsAt: '2026-10-08T00:00:00Z',
    graceEndsAt: null,
    daysLeft: 5,
    suspendedReason: null,
    graceDaysGranted: 0,
    graceGrantCount: 0,
    lastGraceGrantedBy: null,
    lastGraceGrantedAt: null,
    ownerEmail: 'gupta@sweets.com',
    gst: '07BBBBB1111B2Z6',
    createdAt: '2026-09-28T09:00:00Z',
    shops: [
      {
        id: 's2',
        name: 'South Ex Outlet',
        address: 'Ring Road Market',
        mobile: '9811122233',
        createdAt: '2026-09-28T09:00:00Z',
      },
    ],
    users: [
      {
        id: 'u2',
        name: 'Suresh Gupta',
        email: 'gupta@sweets.com',
        role: 'BusinessAdmin',
        createdAt: '2026-09-28T09:00:00Z',
      },
    ],
  },
  {
    id: '3',
    name: 'Apex Supermart',
    slug: 'apex-mart',
    tier: 'Enterprise',
    status: 'Grace',
    isGraceUnlimited: true,
    subscriptionNotes: 'VIP Enterprise account with perpetual grace exception',
    trialEndsAt: '2026-10-01T00:00:00Z',
    graceEndsAt: '2026-10-05T00:00:00Z',
    daysLeft: 2,
    suspendedReason: null,
    graceDaysGranted: 7,
    graceGrantCount: 1,
    lastGraceGrantedBy: 'admin@billify.internal',
    lastGraceGrantedAt: '2026-10-01T12:00:00Z',
    ownerEmail: 'owner@apexmart.in',
    gst: '07CCCCC2222C3Z7',
    createdAt: '2026-08-15T08:30:00Z',
    shops: [
      {
        id: 's3',
        name: 'Apex Flagship Store',
        address: 'Sector 18 Mall',
        mobile: '9988776655',
        createdAt: '2026-08-15T08:30:00Z',
      },
    ],
    users: [
      {
        id: 'u3',
        name: 'Rajiv Malhotra',
        email: 'owner@apexmart.in',
        role: 'BusinessAdmin',
        createdAt: '2026-08-15T08:30:00Z',
      },
    ],
  },
  {
    id: '4',
    name: 'Metro Pharmacy',
    slug: 'metro-pharma',
    tier: 'Starter',
    status: 'Suspended',
    isOverdue: true,
    trialEndsAt: '2026-09-20T00:00:00Z',
    graceEndsAt: '2026-09-27T00:00:00Z',
    daysLeft: 0,
    suspendedReason: 'Grace period expired without active billing subscription.',
    graceDaysGranted: 7,
    graceGrantCount: 1,
    lastGraceGrantedBy: 'admin@billify.internal',
    lastGraceGrantedAt: '2026-09-20T10:00:00Z',
    ownerEmail: 'support@metropharma.com',
    gst: '07DDDDD3333D4Z8',
    createdAt: '2026-08-01T11:00:00Z',
    shops: [
      {
        id: 's4',
        name: 'Metro Hospital Wing',
        address: 'Opposite Civil Hospital',
        mobile: '9123456780',
        createdAt: '2026-08-01T11:00:00Z',
      },
    ],
    users: [
      {
        id: 'u4',
        name: 'Dr. Vivek Verma',
        email: 'support@metropharma.com',
        role: 'BusinessAdmin',
        createdAt: '2026-08-01T11:00:00Z',
      },
    ],
  },
];

export const mockDeployments = [
  {
    id: 'dep-1',
    version: '1.0.5',
    gitSha: '9f2de70f1a2b',
    environment: 'Production',
    deployedAt: '2026-10-03T10:35:12Z',
    deployedBy: 'GitHub Actions',
    notes: 'Tier 1 Frontend and Platform Super Admin release',
  },
  {
    id: 'dep-2',
    version: '0.9.8',
    gitSha: '4c8e19b882da',
    environment: 'Production',
    deployedAt: '2026-10-01T14:20:00Z',
    deployedBy: 'CI/CD Pipeline',
    notes: 'POS catalog speed optimization & receipt styling',
  },
  {
    id: 'dep-3',
    version: '0.9.7',
    gitSha: 'a1b2c3d4e5f6',
    environment: 'Production',
    deployedAt: '2026-09-25T11:15:00Z',
    deployedBy: 'DevOps',
    notes: 'Multi-shop inventory and stock sync release',
  },
];

export const mockTickets = [
  {
    id: 'tic-1',
    name: 'Suresh Gupta',
    email: 'gupta@sweets.com',
    subject: 'Requesting 14-day trial extension',
    message: 'Hello, our store opening was delayed due to shop renovations. Could you please grant an extension to our trial period?',
    status: 'Open',
    createdAt: '2026-10-03T08:15:00Z',
  },
  {
    id: 'tic-2',
    name: 'Anita Roy',
    email: 'anita@fashions.in',
    subject: 'Thermal printer Bluetooth connection issue',
    message: 'We are using an ESC/POS 58mm printer. The mobile browser prints receipts with slight misalignment on paper margins.',
    status: 'Open',
    createdAt: '2026-10-02T16:45:00Z',
  },
  {
    id: 'tic-3',
    name: 'Rajiv Malhotra',
    email: 'owner@apexmart.in',
    subject: 'Enterprise billing invoice inquiry',
    message: 'Please send our annual corporate tax invoice with our GSTIN mentioned.',
    status: 'Closed',
    createdAt: '2026-10-01T12:00:00Z',
  },
];

export const mockAuditLogs = [
  {
    id: 'aud-1',
    timestamp: '2026-10-03T09:40:00Z',
    admin: 'admin@billify.internal',
    action: 'EXTEND_TRIAL',
    targetTenant: 'gupta-sweets',
    ip: '192.168.1.100',
  },
  {
    id: 'aud-2',
    timestamp: '2026-10-02T15:20:00Z',
    admin: 'admin@billify.internal',
    action: 'GRANT_GRACE',
    targetTenant: 'apex-mart',
    ip: '192.168.1.100',
  },
  {
    id: 'aud-3',
    timestamp: '2026-10-01T11:10:00Z',
    admin: 'admin@billify.internal',
    action: 'ACTIVATE_SUBSCRIPTION',
    targetTenant: 'sharma-cloth',
    ip: '10.0.0.12',
  },
  {
    id: 'aud-4',
    timestamp: '2026-09-27T08:00:00Z',
    admin: 'system@billify.internal',
    action: 'SUSPEND_TENANT',
    targetTenant: 'metro-pharma',
    ip: '127.0.0.1',
  },
];

export let mockFeePayments: any[] = [
  {
    id: 'fee-1',
    businessID: '1',
    subscriptionID: 'sub-1',
    amount: 999,
    paidAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    method: 'UPI',
    reference: 'UPI/20261001/887612',
    notes: 'September subscription license fee',
  },
];

export const tier1Handlers = [
  // GET /api/v1/version
  http.get('*/api/v1/version', () => {
    return HttpResponse.json(
      {
        version: '1.0.0',
        gitSha: '9f2de70',
        buildDate: '2026-10-03T10:35:12Z',
        environment: 'Production',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache',
          Pragma: 'no-cache',
        },
      }
    );
  }),

  // GET /api/v1/business/subscription
  http.get('*/api/v1/business/subscription', () => {
    return HttpResponse.json(mockTenantSubscription, {
      headers: {
        'x-subscription-status': mockTenantSubscription.status,
        'x-subscription-tier': mockTenantSubscription.tier,
        'x-subscription-days-left': String(mockTenantSubscription.daysLeft),
      },
    });
  }),

  http.post('*/api/v1/business/subscription/mock-state', async ({ request }) => {
    const body: any = await request.json();
    mockTenantSubscription = { ...mockTenantSubscription, ...body };
    return HttpResponse.json(mockTenantSubscription);
  }),

  // GET /api/v1/business/export
  http.get('*/api/v1/business/export', () => {
    const dummyZip = new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    return new HttpResponse(dummyZip, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="billify-export.zip"',
      },
    });
  }),

  // POST /api/v1/support/contact
  http.post('*/api/v1/support/contact', () => {
    return HttpResponse.json({ success: true, message: "We'll get back to you soon." });
  }),

  // Platform Auth
  http.post('*/platform/auth/login', () => {
    return HttpResponse.json({
      accessToken: 'mock-platform-jwt-token',
      refreshToken: 'mock-platform-refresh-token',
      user: {
        id: 'admin-1',
        email: 'admin@billify.internal',
        name: 'Platform Super Admin',
        role: 'SuperAdmin',
      },
    });
  }),

  http.post('*/platform/auth/refresh', () => {
    return HttpResponse.json({
      accessToken: 'mock-platform-jwt-token-refreshed',
      refreshToken: 'mock-platform-refresh-token-refreshed',
    });
  }),

  http.post('*/platform/auth/forgot-password', () => {
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/auth/reset-password', () => {
    return HttpResponse.json({ success: true });
  }),

  // Platform Metrics
  http.get('*/platform/metrics', () => {
    return HttpResponse.json({
      totalBusinesses: mockBusinesses.length,
      active: 1,
      trialOrGrace: 2,
      suspended: 1,
    });
  }),

  // Platform Businesses
  http.get('*/platform/businesses', () => {
    return HttpResponse.json(mockBusinesses);
  }),

  // POST */platform/businesses/create
  http.post('*/platform/businesses/create', async ({ request }) => {
    const body: any = await request.json();
    const newId = String(mockBusinesses.length + 1);
    const newBiz: any = {
      id: newId,
      name: body.name,
      slug: body.slug,
      tier: 'Starter',
      status: 'Trial',
      daysLeft: body.trialDays || 14,
      trialEndsAt: new Date(Date.now() + (body.trialDays || 14) * 86400000).toISOString(),
      graceEndsAt: null,
      ownerEmail: body.ownerEmail,
      gst: body.gst || null,
      createdAt: new Date().toISOString(),
      shops: [
        {
          id: `shop-${newId}`,
          name: `${body.name} Main Branch`,
          address: 'Main Market Road',
          mobile: body.ownerMobile,
          createdAt: new Date().toISOString(),
        },
      ],
      users: [
        {
          id: `usr-${newId}`,
          name: body.ownerName,
          email: body.ownerEmail,
          role: 'BusinessAdmin',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    mockBusinesses.push(newBiz);
    return HttpResponse.json(
      {
        tenantID: Number(newId) || newId,
        slug: body.slug,
        ownerUserID: `usr-${newId}`,
        defaultShopID: `shop-${newId}`,
        credentials: {
          loginURL: 'https://billify-d0q.pages.dev/login',
          tenantSlug: body.slug,
          email: body.ownerEmail,
          mobile: body.ownerMobile,
          password: body.ownerPassword,
        },
      },
      { status: 201 }
    );
  }),

  // GET */platform/businesses/check-slug
  http.get('*/platform/businesses/check-slug', ({ request }) => {
    const url = new URL(request.url, 'http://localhost');
    const slug = (url.searchParams.get('slug') || '').toLowerCase().trim();
    const exists = mockBusinesses.some((b) => (b.slug || '').toLowerCase() === slug);
    return HttpResponse.json({ available: !exists });
  }),

  // POST */platform/businesses/generate-password
  http.post('*/platform/businesses/generate-password', () => {
    return HttpResponse.json({ password: 'P@ssw0rd' + Math.floor(1000 + Math.random() * 9000) + '!' });
  }),

  // POST */platform/businesses/:id/block
  http.post('*/platform/businesses/:id/block', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Blocked';
      (b as any).subscriptionStatus = 'Blocked';
      (b as any).blockedReason = body.reason;
    }
    return HttpResponse.json({ success: true });
  }),

  // POST */platform/businesses/:id/unblock
  http.post('*/platform/businesses/:id/unblock', async ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Active';
      (b as any).subscriptionStatus = 'Active';
    }
    return HttpResponse.json({ success: true });
  }),

  // GET */platform/businesses/:id/subscription-events
  http.get('*/platform/businesses/:id/subscription-events', () => {
    return HttpResponse.json([
      {
        id: 'evt-1',
        eventType: 'TrialStarted',
        triggeredBy: 'SuperAdmin',
        reason: 'Initial onboarding',
        createdAt: new Date().toISOString(),
      },
    ]);
  }),
  // GET */platform/businesses/:id/subscription
  http.get('*/platform/businesses/:id/subscription', ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id) || mockBusinesses[0];
    return HttpResponse.json({
      businessId: b.id,
      name: b.name,
      slug: b.slug,
      currentPlan: {
        id: 'sub-001',
        plan: b.tier || 'Pro',
        billingCycle: 'Monthly',
        amount: 999,
        currency: 'INR',
        startedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        nextDueAt: new Date(Date.now() + 15 * 86400000).toISOString(),
        status: 'Active',
        notes: 'Standard tier plan',
        isOverdue: false,
      },
      history: [],
    });
  }),

  // POST */platform/businesses/:id/subscription
  http.post('*/platform/businesses/:id/subscription', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.tier = body.plan;
    }
    return HttpResponse.json({
      id: 'sub-new',
      businessID: params.id,
      plan: body.plan,
      billingCycle: body.billingCycle,
      amount: body.amount,
      currency: 'INR',
      startedAt: new Date().toISOString(),
      nextDueAt: body.nextDueAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'Active',
      notes: body.notes,
    });
  }),

  // GET */platform/businesses/:id/fees
  http.get('*/platform/businesses/:id/fees', ({ params }) => {
    const payments = mockFeePayments.filter(
      (p: any) => String(p.businessID) === String(params.id) || p.businessID === '1'
    );
    const total = payments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
    return HttpResponse.json({
      payments,
      totalPaidLifetime: total,
    });
  }),

  // POST */platform/businesses/:id/fees
  http.post('*/platform/businesses/:id/fees', async ({ params, request }) => {
    const body: any = await request.json();
    const newFee = {
      id: 'fee-' + Date.now(),
      businessID: String(params.id),
      amount: Number(body.amount) || 999,
      paidAt: new Date().toISOString(),
      method: body.method || 'UPI',
      reference: body.reference || '',
      notes: body.notes || '',
    };
    mockFeePayments.unshift(newFee);
    return HttpResponse.json(newFee);
  }),

  // GET */platform/fees/report
  http.get('*/platform/fees/report', () => {
    return HttpResponse.json({
      mrr: 2999,
      overdueAccountsCount: 1,
      totalCollected: 5997,
      totalRevenuePeriod: 5997,
      periodPaymentsCount: 3,
      byMethod: { cash: 1999, upi: 2999, bank: 999, other: 0 },
      byPlan: { starter: 999, pro: 1999, enterprise: 3000 },
      payments: [],
    });
  }),

  // GET */platform/usage/statistics
  http.get('*/platform/usage/statistics', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.includes('trigger-401')) {
      return new HttpResponse(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const businesses = [
      { id: '1', name: 'Kirana Supermart', slug: 'kirana-supermart', shops: 2, users: 4, products: 48, customers: 35, bills: 428, estimatedSizeMB: 1.25 },
      { id: '2', name: 'Apex Electronics', slug: 'apex-electronics', shops: 3, users: 6, products: 84, customers: 52, bills: 890, estimatedSizeMB: 2.45 },
      ...mockBusinesses.map((b, idx) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        shops: (b.shops && b.shops.length) || 1,
        users: (b.users && b.users.length) || 1,
        products: 12 + idx * 4,
        customers: 8 + idx * 3,
        bills: 20 + idx * 15,
        estimatedSizeMB: 0.45 + idx * 0.25,
      })),
    ];

    return HttpResponse.json({
      totals: {
        businesses: businesses.length,
        activeBusinesses: mockBusinesses.filter((b) => (b.status || '').toLowerCase() === 'active').length || 2,
        suspendedBusinesses: mockBusinesses.filter((b) => (b.status || '').toLowerCase() === 'suspended').length || 1,
        shops: businesses.reduce((acc, b) => acc + b.shops, 0),
        users: businesses.reduce((acc, b) => acc + b.users, 0),
        products: 132,
        customers: 87,
        bills: 1318,
        billItems: 3450,
        payments: 1318,
        coupons: 8,
        offers: 5,
        stockMovements: 64,
      },
      perBusiness: businesses.map((b) => ({
        tenantID: b.id,
        name: b.name,
        slug: b.slug,
        shops: b.shops,
        users: b.users,
        products: b.products,
        customers: b.customers,
        bills: b.bills,
        estimatedSizeMB: b.estimatedSizeMB,
        lastActivityAt: new Date().toISOString(),
      })),
      estimatedTotalSizeMB: 3.70,
      generatedAt: new Date().toISOString(),
    });
  }),

  http.get('*/platform/businesses/:id', ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id) || mockBusinesses[0];
    return HttpResponse.json(b);
  }),

  http.post('*/platform/businesses/:id/grant-grace', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Grace';
      b.graceDaysGranted = (b.graceDaysGranted || 0) + (body.days || 7);
      b.graceGrantCount = (b.graceGrantCount || 0) + 1;
      b.lastGraceGrantedBy = 'admin@billify.internal';
      b.lastGraceGrantedAt = new Date().toISOString();
      b.daysLeft = body.days || 7;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/extend-trial', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Trial';
      b.daysLeft = (b.daysLeft || 0) + (body.days || 14);
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/reset-trial', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Trial';
      b.daysLeft = body.days || 14;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/activate', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Active';
      b.tier = body.tier || 'Pro';
      b.daysLeft = 365;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/suspend', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.status = 'Suspended';
      b.suspendedReason = body.reason || 'Manually suspended by platform admin';
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/grant-unlimited-grace', ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      (b as any).isGraceUnlimited = true;
      b.status = 'Grace';
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/clear-unlimited', ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      (b as any).isGraceUnlimited = false;
      (b as any).isTrialUnlimited = false;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/subscription-dates', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      b.trialEndsAt = body.trialEndsAt;
      b.graceEndsAt = body.graceEndsAt;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/subscription-notes', async ({ params, request }) => {
    const body: any = await request.json();
    const b = mockBusinesses.find((item) => item.id === params.id);
    if (b) {
      (b as any).subscriptionNotes = body.notes;
    }
    return HttpResponse.json({ success: true });
  }),

  http.post('*/platform/businesses/:id/impersonate', ({ params }) => {
    const b = mockBusinesses.find((item) => item.id === params.id) || mockBusinesses[0];
    return HttpResponse.json({
      accessToken: 'mock-impersonated-jwt',
      refreshToken: 'mock-impersonated-rt',
      user: {
        userID: 'imp-user-' + b.id,
        tenantID: Number(b.id) || 1,
        role: 'BusinessAdmin',
        email: b.ownerEmail,
        name: b.name + ' Owner',
      },
    });
  }),

  // Platform Deployments
  http.get('*/platform/deployments', () => {
    return HttpResponse.json(mockDeployments);
  }),

  // Platform Support Tickets
  http.get('*/platform/support-tickets', () => {
    return HttpResponse.json(mockTickets);
  }),

  http.patch('*/platform/support-tickets/:id/status', async ({ params, request }) => {
    const body: any = await request.json();
    const t = mockTickets.find((item) => item.id === params.id);
    if (t) {
      t.status = body.status || 'Closed';
    }
    return HttpResponse.json({ success: true });
  }),

  // Platform Audit Logs
  http.get('*/platform/audit-logs', () => {
    return HttpResponse.json(mockAuditLogs);
  }),

  // WhatsApp Tenant API
  http.get('*/api/v1/whatsapp/config', ({ request }) => {
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shopId') || 's1';
    const cfg = mockWhatsAppConfigs[shopId] || {
      shopId,
      phoneNumberId: '',
      wabaId: '',
      accessToken: '',
      hasAccessToken: false,
      verifyToken: '',
      isActive: false,
    };
    return HttpResponse.json(cfg);
  }),

  http.post('*/api/v1/whatsapp/config', async ({ request }) => {
    const body: any = await request.json();
    const shopId = body.shopId || 's1';
    const existing = mockWhatsAppConfigs[shopId] || {};
    mockWhatsAppConfigs[shopId] = {
      ...existing,
      ...body,
      hasAccessToken: Boolean(body.accessToken || existing.hasAccessToken),
      accessToken: body.accessToken ? '••••••••••••••••••••' : existing.accessToken,
    };
    return HttpResponse.json(mockWhatsAppConfigs[shopId]);
  }),

  http.post('*/api/v1/whatsapp/test', async ({ request }) => {
    const body: any = await request.json();
    return HttpResponse.json({
      success: true,
      message: `Test connection successful! Ping dispatched to ${body.recipientPhone || 'device'}.`,
    });
  }),

  http.get('*/api/v1/whatsapp/dashboard', ({ request }) => {
    const url = new URL(request.url);
    const shopId = url.searchParams.get('shopId') || 's1';
    const usage = mockWhatsAppUsage[shopId] || {
      sentThisMonth: 482,
      monthlyLimit: 1000,
      allTimeSent: 1845,
      failedCount: 12,
    };
    return HttpResponse.json(usage);
  }),

  http.get('*/api/v1/whatsapp/messages', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let filtered = [...mockWhatsAppMessages];
    if (status && status !== 'all') {
      filtered = filtered.filter((m) => m.status === status);
    }
    return HttpResponse.json(filtered);
  }),

  http.post('*/api/v1/whatsapp/send', async ({ request }) => {
    const body: any = await request.json();
    const newMsg = {
      id: 'msg-' + Date.now(),
      recipient: body.recipientPhone,
      type: body.type || 'text',
      templateName: body.type === 'template' ? body.template?.name || 'bill_receipt_v1' : '—',
      status: 'sent',
      sentAt: new Date().toISOString(),
      content:
        body.type === 'text'
          ? body.text
          : `Template: ${body.template?.name || 'bill_receipt_v1'} | Params: ${(body.template?.params || []).join(', ')}`,
      error: null,
    };
    mockWhatsAppMessages.unshift(newMsg);
    const shopId = body.shopId || 's1';
    if (!mockWhatsAppUsage[shopId]) {
      mockWhatsAppUsage[shopId] = { sentThisMonth: 0, monthlyLimit: 1000, allTimeSent: 0, failedCount: 0 };
    }
    mockWhatsAppUsage[shopId].sentThisMonth += 1;
    mockWhatsAppUsage[shopId].allTimeSent += 1;
    return HttpResponse.json({ success: true, messageId: 'wamid.' + Date.now() });
  }),

  // Platform WhatsApp Admin
  http.get('*/platform/whatsapp/tenants', () => {
    return HttpResponse.json(mockWhatsAppTenants);
  }),

  http.post('*/platform/whatsapp/shops/:shopId/disable', ({ params }) => {
    const shopId = params.shopId;
    const t = mockWhatsAppTenants.find((item) => item.shopId === shopId);
    if (t) {
      t.isActive = false;
    }
    if (mockWhatsAppConfigs[shopId as string]) {
      mockWhatsAppConfigs[shopId as string].isActive = false;
    }
    return HttpResponse.json({ success: true });
  }),
];

export let mockTenantSubscription = {
  status: 'Trial',
  tier: 'Starter',
  trialEndsAt: '2026-10-08T00:00:00Z',
  graceEndsAt: null,
  daysLeft: 5,
  suspendedReason: null,
  isGraceUnlimited: false,
  isTrialUnlimited: false,
  subscriptionNotes: null,
};

let mockWhatsAppConfigs: Record<string, any> = {
  '11111111-1111-1111-1111-111111111111': {
    id: 'wac-main',
    shopId: '11111111-1111-1111-1111-111111111111',
    phoneNumberId: '104928172648192',
    wabaId: '918273645019283',
    accessToken: '••••••••••••••••••••',
    hasAccessToken: true,
    verifyToken: 'paylift_verify_sec_99',
    isActive: true,
  },
  s1: {
    id: 'wac-s1',
    shopId: 's1',
    phoneNumberId: '104928172648192',
    wabaId: '918273645019283',
    accessToken: '••••••••••••••••••••',
    hasAccessToken: true,
    verifyToken: 'paylift_verify_sec_99',
    isActive: true,
  },
};

let mockWhatsAppUsage: Record<string, any> = {
  '11111111-1111-1111-1111-111111111111': {
    sentThisMonth: 482,
    monthlyLimit: 1000,
    allTimeSent: 1845,
    failedCount: 12,
  },
  s1: {
    sentThisMonth: 482,
    monthlyLimit: 1000,
    allTimeSent: 1845,
    failedCount: 12,
  },
};

let mockWhatsAppMessages: any[] = [
  {
    id: 'msg-001',
    recipient: '+919876543210',
    type: 'template',
    templateName: 'bill_receipt_v1',
    status: 'delivered',
    sentAt: '2026-10-04T08:15:00Z',
    content: 'Hi Ramesh, thank you for your purchase of ₹1,450.00 at Sharma Cloth Emporium. Bill #BILL-2026-001.',
    error: null,
  },
  {
    id: 'msg-002',
    recipient: '+919811223344',
    type: 'text',
    templateName: '—',
    status: 'read',
    sentAt: '2026-10-04T07:30:00Z',
    content: 'Your exchange request has been approved. Please visit the store with your receipt.',
    error: null,
  },
  {
    id: 'msg-003',
    recipient: '+919988776655',
    type: 'template',
    templateName: 'bill_receipt_v1',
    status: 'failed',
    sentAt: '2026-10-03T16:45:00Z',
    content: 'Hi customer, thank you for your purchase...',
    error: 'Recipient phone number not registered on WhatsApp',
  },
  {
    id: 'msg-004',
    recipient: '+919822334455',
    type: 'template',
    templateName: 'bill_receipt_v1',
    status: 'sent',
    sentAt: '2026-10-03T14:10:00Z',
    content: 'Hi Priya, thank you for your purchase of ₹890.00 at Sharma Cloth Emporium.',
    error: null,
  },
];

let mockWhatsAppTenants: any[] = [
  {
    tenantId: '1',
    tenantName: 'Sharma Cloth Emporium',
    shopId: 's1',
    shopName: 'Main Branch - Chandni Chowk',
    phoneNumberId: '104928172648192',
    isActive: true,
    sentThisMonth: 482,
    monthlyLimit: 1000,
    allTimeSent: 1845,
    failedCount: 12,
    lastSentAt: '2026-10-04T08:15:00Z',
  },
  {
    tenantId: '2',
    tenantName: 'Gupta Sweets & Bakers',
    shopId: 's2',
    shopName: 'South Ex Outlet',
    phoneNumberId: '109876543210987',
    isActive: true,
    sentThisMonth: 920,
    monthlyLimit: 1000,
    allTimeSent: 3410,
    failedCount: 24,
    lastSentAt: '2026-10-04T09:10:00Z',
  },
  {
    tenantId: '3',
    tenantName: 'Apex Supermart',
    shopId: 's3',
    shopName: 'Apex Flagship Store',
    phoneNumberId: '108877665544332',
    isActive: false,
    sentThisMonth: 1020,
    monthlyLimit: 1000,
    allTimeSent: 8900,
    failedCount: 56,
    lastSentAt: '2026-10-02T11:20:00Z',
  },
];
