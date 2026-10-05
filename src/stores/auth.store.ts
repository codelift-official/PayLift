import { create } from 'zustand';
import axios from 'axios';
import { queryClient } from '../lib/queryClient';

export type Role = 'BusinessAdmin' | 'Manager' | 'Staff';

export interface AuthUser {
  userID: string;
  tenantID: number;
  role: Role;
  email?: string | null;
  mobile?: string;
  name?: string;
  defaultShopID?: string | null;
  assignedShopIDs?: string[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  tenantSlug: string;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  setTenantSlug: (slug: string) => void;
  logout: () => Promise<void>;
  hydrate: () => void;
}

// ─── Role Selector Helpers ────────────────────────────────────────────────────

export const isBusinessAdmin = (user?: AuthUser | null): boolean => {
  const u = user !== undefined ? user : useAuthStore.getState().user;
  return u?.role === 'BusinessAdmin';
};

export const isManager = (user?: AuthUser | null): boolean => {
  const u = user !== undefined ? user : useAuthStore.getState().user;
  return u?.role === 'Manager';
};

export const isStaff = (user?: AuthUser | null): boolean => {
  const u = user !== undefined ? user : useAuthStore.getState().user;
  return u?.role === 'Staff';
};

export const canManageUsers = (user?: AuthUser | null): boolean =>
  isBusinessAdmin(user);

export const canManageSettings = (user?: AuthUser | null): boolean =>
  isBusinessAdmin(user) || isManager(user);

export const canViewReports = (user?: AuthUser | null): boolean =>
  isBusinessAdmin(user) || isManager(user);

export const canManageCatalog = (user?: AuthUser | null): boolean =>
  isBusinessAdmin(user);

// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  AT: 'billify.auth.at',
  RT: 'billify.auth.rt',
  USER: 'billify.auth.user',
  TENANT: 'billify.auth.tenant',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
  tenantSlug: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.TENANT) || '' : '',

  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AT, accessToken);
      localStorage.setItem(STORAGE_KEYS.RT, refreshToken);
    }
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user: AuthUser | null) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    }
    set({ user });
  },

  setTenantSlug: (slug: string) => {
    if (typeof window !== 'undefined') {
      if (slug) {
        localStorage.setItem(STORAGE_KEYS.TENANT, slug);
      } else {
        localStorage.removeItem(STORAGE_KEYS.TENANT);
      }
    }
    set({ tenantSlug: slug });
  },

  logout: async () => {
    const { accessToken, refreshToken } = get();
    const baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      if (accessToken) {
        await axios.post(
          `${baseURL}/api/v1/auth/logout`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } catch {
      // Ignore errors on logout
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AT);
        localStorage.removeItem(STORAGE_KEYS.RT);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      queryClient.clear();
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;

    try {
      const at = localStorage.getItem(STORAGE_KEYS.AT);
      const rt = localStorage.getItem(STORAGE_KEYS.RT);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      const tenant = localStorage.getItem(STORAGE_KEYS.TENANT) || '';
      const user = userStr ? JSON.parse(userStr) : null;

      if (rt && user) {
        set({
          accessToken: at,
          refreshToken: rt,
          user,
          tenantSlug: tenant,
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          tenantSlug: tenant,
          isAuthenticated: false,
          isHydrated: true,
        });
      }
    } catch {
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
}));
