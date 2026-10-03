import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { toast } from 'sonner';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';

const baseURL = isMock
  ? ''
  : (import.meta.env.VITE_API_URL ||
     import.meta.env.VITE_API_BASE_URL ||
     'http://localhost:5000');

export const apiClient = axios.create({
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

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.headers && !config.headers['X-Correlation-ID']) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        config.headers['X-Correlation-ID'] = crypto.randomUUID();
      }
    }

    const tenantSlug = useAuthStore.getState().tenantSlug;
    if (tenantSlug && config.headers && !config.headers['X-Tenant-Slug']) {
      const url = config.url || '';
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/otp') ||
        url.includes('/auth/forgot-password')
      ) {
        config.headers['X-Tenant-Slug'] = tenantSlug;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || '';
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || '';

    // Handle 403 Suspended
    if (status === 403 && errorMessage.toLowerCase().includes('suspended')) {
      toast.error('Account suspended. Please contact platform support.');
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle 429
    if (status === 429) {
      toast.error('Too many attempts. Please try again later.');
      return Promise.reject(error);
    }

    // Handle 500
    if (status === 500) {
      toast.error('Something went wrong on the server.');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/otp');

    if (status === 401 && !isAuthRoute && originalRequest) {
      // Avoid retrying POST requests silently to prevent double mutations
      const method = (originalRequest.method || 'get').toUpperCase();
      if (method === 'POST') {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
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
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${baseURL}/api/v1/auth/refresh`, { refreshToken });

        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
