import { apiClient } from './client';

export interface TenantUser {
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

export interface CreateUserPayload {
  email: string;
  mobile?: string;
  name?: string;
  password: string;
  role: 'Manager' | 'Staff';
  shopIDs?: string[];
  assignedShopIDs?: string[];
}

export interface UpdateUserPayload {
  mobile?: string;
  name?: string;
  role: 'Manager' | 'Staff';
  shopIDs?: string[];
  assignedShopIDs?: string[];
}

export function normalizeUser(raw: any): TenantUser {
  if (!raw) return raw;

  const shopList: string[] = Array.isArray(raw.assignedShopIDs)
    ? raw.assignedShopIDs
    : Array.isArray(raw.shopAccesses)
      ? raw.shopAccesses.map((sa: any) => sa.shopID || sa.id || sa)
      : Array.isArray(raw.shopIDs)
        ? raw.shopIDs
        : [];

  return {
    userID: raw.userID || raw.id || '',
    tenantID: raw.tenantID || raw.businessID || 0,
    email: raw.email || '',
    mobile: raw.mobile || '',
    name: raw.name || '',
    role: raw.role || 'Staff',
    assignedShopIDs: shopList,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export const usersApi = {
  getUsers: async (): Promise<TenantUser[]> => {
    const res = await apiClient.get<any[]>('/api/v1/users');
    const data = Array.isArray(res.data) ? res.data : [];
    return data.map(normalizeUser);
  },

  getUserById: async (id: string): Promise<TenantUser> => {
    const res = await apiClient.get<any>(`/api/v1/users/${id}`);
    return normalizeUser(res.data);
  },

  createUser: async (payload: CreateUserPayload): Promise<TenantUser> => {
    const shopList = payload.shopIDs || payload.assignedShopIDs || [];
    const body = {
      ...payload,
      mobile: payload.mobile || '9876543210',
      shopIDs: shopList,
      assignedShopIDs: shopList,
    };
    const res = await apiClient.post<any>('/api/v1/users', body);
    return normalizeUser(res.data);
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<TenantUser> => {
    const shopList = payload.shopIDs || payload.assignedShopIDs || [];
    const body = {
      ...payload,
      shopIDs: shopList,
      assignedShopIDs: shopList,
    };
    const res = await apiClient.put<any>(`/api/v1/users/${id}`, body);
    return normalizeUser(res.data);
  },

  deactivateUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${id}`);
  },
};
