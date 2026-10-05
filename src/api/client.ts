import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import { toast } from 'sonner';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';

const baseURL = isMock
  ? ''
  : (import.meta.env.VITE_API_URL ||
     import.meta.env.VITE_API_BASE_URL ||
     'http://localhost:5000');

export interface ApiTrace {
  id: string;
  method: string;
  url: string;
  status?: number;
  durationMs?: number;
  requestHeaders?: any;
  requestBody?: any;
  responseData?: any;
  error?: any;
  timestamp: string;
}

declare global {
  interface Window {
    __apiTraces?: ApiTrace[];
    getApiTraces?: () => ApiTrace[];
    clearApiTraces?: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.__apiTraces = window.__apiTraces || [];
  window.getApiTraces = () => window.__apiTraces || [];
  window.clearApiTraces = () => {
    window.__apiTraces = [];
  };
}

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
      config.headers['X-Tenant-Slug'] = tenantSlug;
    }

    // Attach tracing metadata
    const traceId = (config.headers?.['X-Correlation-ID'] as string) || String(Date.now());
    (config as any).__traceId = traceId;
    (config as any).__startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (typeof window !== 'undefined') {
      const trace: ApiTrace = {
        id: traceId,
        method: (config.method || 'GET').toUpperCase(),
        url: `${config.baseURL || ''}${config.url || ''}`,
        requestHeaders: config.headers ? { ...config.headers } : undefined,
        requestBody: config.data,
        timestamp: new Date().toISOString(),
      };
      window.__apiTraces = [trace, ...(window.__apiTraces || [])].slice(0, 100);

      // Console grouping for easy dev inspection
      console.groupCollapsed(
        `%c🚀 [API REQ] ${trace.method} ${config.url || ''}`,
        'color: #3b82f6; font-weight: bold;'
      );
      console.log('Full URL:', trace.url);
      console.log('Headers:', trace.requestHeaders);
      if (trace.requestBody) console.log('Body:', trace.requestBody);
      console.groupEnd();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const duration = config?.__startTime
      ? Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - config.__startTime)
      : 0;

    if (typeof window !== 'undefined' && window.__apiTraces && config?.__traceId) {
      const trace = window.__apiTraces.find((t) => t.id === config.__traceId);
      if (trace) {
        trace.status = response.status;
        trace.durationMs = duration;
        trace.responseData = response.data;
      }
      console.groupCollapsed(
        `%c✅ [API RES ${response.status}] ${(config.method || 'GET').toUpperCase()} ${config.url || ''} (${duration}ms)`,
        'color: #10b981; font-weight: bold;'
      );
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      console.log('Duration:', `${duration}ms`);
      console.groupEnd();
    }

    return response;
  },
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      __traceId?: string;
      __startTime?: number;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || '';
    const errorData = error.response?.data;
    const errorMessage = errorData?.error || errorData?.message || '';

    const duration = originalRequest?.__startTime
      ? Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - originalRequest.__startTime)
      : 0;

    if (typeof window !== 'undefined' && window.__apiTraces && originalRequest?.__traceId) {
      const trace = window.__apiTraces.find((t) => t.id === originalRequest.__traceId);
      if (trace) {
        trace.status = status || 0;
        trace.durationMs = duration;
        trace.error = errorData || error.message;
      }
      console.groupCollapsed(
        `%c❌ [API ERR ${status || 'FAIL'}] ${(originalRequest?.method || 'GET').toUpperCase()} ${originalRequest?.url || ''} (${duration}ms)`,
        'color: #ef4444; font-weight: bold;'
      );
      console.error('Error Response:', errorData || error.message);
      console.log('Status Code:', status);
      console.log('Payload Sent:', originalRequest?.data);
      console.groupEnd();
    }

    // Handle 403 Suspended
    if (status === 403 && errorMessage.toLowerCase().includes('suspended')) {
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/suspended' &&
        window.location.pathname !== '/contact'
      ) {
        window.location.href = '/suspended';
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
        if (typeof window !== 'undefined') {
          const isPlatform = originalRequest?.url?.includes('/platform') || window.location.pathname.startsWith('/platform');
          const target = isPlatform ? '/platform/login' : '/login';
          if (window.location.pathname !== target) {
            window.location.replace(target);
          }
        }
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          const isPlatform = originalRequest?.url?.includes('/platform') || window.location.pathname.startsWith('/platform');
          const target = isPlatform ? '/platform/login' : '/login';
          if (window.location.pathname !== target) {
            window.location.replace(target);
          }
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
        if (typeof window !== 'undefined') {
          const isPlatform = originalRequest?.url?.includes('/platform') || window.location.pathname.startsWith('/platform');
          const target = isPlatform ? '/platform/login' : '/login';
          if (window.location.pathname !== target) {
            window.location.replace(target);
          }
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
        if (typeof window !== 'undefined') {
          const isPlatform = originalRequest?.url?.includes('/platform') || window.location.pathname.startsWith('/platform');
          const target = isPlatform ? '/platform/login' : '/login';
          if (window.location.pathname !== target) {
            window.location.replace(target);
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
