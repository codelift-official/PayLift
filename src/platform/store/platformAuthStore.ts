import { create } from 'zustand';

export interface PlatformUser {
  id?: string;
  email: string;
  name?: string;
  role?: string;
}

export interface PlatformAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: PlatformUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: PlatformUser | null) => void;
  logout: () => void;
  hydrate: () => void;
}

const STORAGE_KEYS = {
  AT: 'platform_at',
  RT: 'platform_rt',
  USER: 'platform_user',
  IMP_BACKUP: 'platform_imp_backup',
};

export const usePlatformAuthStore = create<PlatformAuthState>((set) => {
  // Read initial sync if in browser
  let initialAt: string | null = null;
  let initialRt: string | null = null;
  let initialUser: PlatformUser | null = null;
  let initialAuth = false;

  if (typeof window !== 'undefined') {
    try {
      initialAt = localStorage.getItem(STORAGE_KEYS.AT);
      initialRt = localStorage.getItem(STORAGE_KEYS.RT);
      const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (rawUser) {
        initialUser = JSON.parse(rawUser);
      }
      initialAuth = !!(initialAt && initialUser);
    } catch {
      // Ignore JSON parse error
    }
  }

  return {
    accessToken: initialAt,
    refreshToken: initialRt,
    user: initialUser,
    isAuthenticated: initialAuth,
    isHydrated: true,

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

    setUser: (user: PlatformUser | null) => {
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
      set({
        user,
        isAuthenticated: !!user,
      });
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.AT);
        localStorage.removeItem(STORAGE_KEYS.RT);
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
      });
    },

    hydrate: () => {
      if (typeof window === 'undefined') return;
      try {
        const at = localStorage.getItem(STORAGE_KEYS.AT);
        const rt = localStorage.getItem(STORAGE_KEYS.RT);
        const userStr = localStorage.getItem(STORAGE_KEYS.USER);
        const user = userStr ? JSON.parse(userStr) : null;

        if (at && user) {
          set({
            accessToken: at,
            refreshToken: rt,
            user,
            isAuthenticated: true,
            isHydrated: true,
          });
        } else {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
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
  };
});
