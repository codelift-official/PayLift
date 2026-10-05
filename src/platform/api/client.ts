import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { usePlatformAuthStore } from '../store/platformAuthStore';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';

const baseURL = isMock
  ? ''
  : (import.meta.env.VITE_API_URL ||
     import.meta.env.VITE_API_BASE_URL ||
     '');

export const platformApiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach platform bearer token
platformApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = usePlatformAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with /platform/auth/refresh
platformApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || '';

    const isPlatformAuthRoute =
      url.includes('/platform/auth/login') ||
      url.includes('/platform/auth/refresh') ||
      url.includes('/platform/auth/forgot-password');

    if (status === 401 && !isPlatformAuthRoute && originalRequest) {
      if (originalRequest._retry) {
        usePlatformAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/platform/login')) {
          window.location.replace('/platform/login');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return platformApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = usePlatformAuthStore.getState().refreshToken;
      if (!refreshToken) {
        usePlatformAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/platform/login')) {
          window.location.replace('/platform/login');
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${baseURL}/platform/auth/refresh`, { refreshToken });

        usePlatformAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return platformApiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        usePlatformAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/platform/login')) {
          window.location.replace('/platform/login');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
