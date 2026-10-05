import { http, HttpResponse } from 'msw';

// In-memory mock users store (extends seed users)
interface MockTenantUser {
  userID: string;
  tenantID: number;
  email: string;
  mobile?: string;
  name?: string;
  role: 'Manager' | 'Staff';
  assignedShopIDs: string[];
  isActive: boolean;
  createdAt: string;
}

const mockTenantUsers: MockTenantUser[] = [
  {
    userID: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    tenantID: 1,
    email: 'manager@kiranamart.com',
    mobile: '9876543212',
    name: 'Priya Sharma',
    role: 'Manager',
    assignedShopIDs: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
    isActive: true,
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    userID: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    tenantID: 1,
    email: 'staff1@kiranamart.com',
    mobile: '9876543213',
    name: 'Ravi Kumar',
    role: 'Staff',
    assignedShopIDs: ['11111111-1111-1111-1111-111111111111'],
    isActive: true,
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    userID: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    tenantID: 1,
    email: 'staff2@kiranamart.com',
    mobile: '9876543214',
    name: 'Anjali Singh',
    role: 'Staff',
    assignedShopIDs: ['22222222-2222-2222-2222-222222222222'],
    isActive: false,
    createdAt: '2026-04-01T09:00:00Z',
  },
];

let userIdSeq = 1000;

export const usersHandlers = [
  // GET /api/v1/users — list all tenant users (BusinessAdmin only)
  http.get('/api/v1/users', () => {
    return HttpResponse.json(mockTenantUsers);
  }),

  // GET /api/v1/users/:id — get single user
  http.get('/api/v1/users/:id', ({ params }) => {
    const { id } = params;
    const user = mockTenantUsers.find((u) => u.userID === id);
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  // POST /api/v1/users — invite / create user
  http.post('/api/v1/users', async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'apierr@store.com' || (body.shopIDs && body.shopIDs.includes('invalid-shop'))) {
      return HttpResponse.json({ error: 'One or more shops do not belong to this business.' }, { status: 400 });
    }
    const newUser: MockTenantUser = {
      userID: `mock-user-${++userIdSeq}`,
      tenantID: 1,
      email: body.email || 'new@example.com',
      mobile: body.mobile || '',
      name: body.name || '',
      role: body.role || 'Staff',
      assignedShopIDs: body.shopIDs || body.assignedShopIDs || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockTenantUsers.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  // PUT /api/v1/users/:id — update user
  http.put('/api/v1/users/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;
    const idx = mockTenantUsers.findIndex((u) => u.userID === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    mockTenantUsers[idx] = {
      ...mockTenantUsers[idx],
      ...body,
      userID: id as string,
    };
    return HttpResponse.json(mockTenantUsers[idx]);
  }),

  // DELETE /api/v1/users/:id — deactivate user
  http.delete('/api/v1/users/:id', ({ params }) => {
    const { id } = params;
    const idx = mockTenantUsers.findIndex((u) => u.userID === id);
    if (idx === -1) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 });
    }
    mockTenantUsers[idx].isActive = false;
    return HttpResponse.json({ success: true });
  }),
];
