# Billify Frontend Integration Guide

This guide is the complete blueprint for frontend engineers building or integrating applications with the **Billify API**. It covers client configuration, authentication lifecycles, universal grid consumption, receipt printing via Web Bluetooth, state management, and real-world code examples.

---

## 1. Getting Started

### Base URL Configuration
Configure environment-specific base URLs in your frontend build tool (Vite, Next.js, etc.):
```typescript
// src/config/api.config.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  timeoutMs: 15000,
  defaultPageSize: 50,
  cacheStaleTimeMs: 30_000, // 30 seconds
};
```

### HTTP Client Setup (Axios / Fetch Wrapper)
A centralized client handles authorization headers and client-side correlation ID generation:

```typescript
// src/lib/api-client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT & X-Correlation-ID
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('billify_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Ensure unique Correlation ID on every outgoing call
  if (!config.headers['X-Correlation-ID']) {
    config.headers['X-Correlation-ID'] = crypto.randomUUID();
  }

  return config;
});
```

---

## 2. Authentication Lifecycle

### The Three Golden Rules of Multi-Tenancy
1. **Never send `tenantID` or `businessID` in any request body or URL**: The server determines tenancy solely from the validated JWT claims.
2. **Tenant Slug on Login Only**: The slug is sent during `POST /api/v1/auth/login` (via request body and `X-Tenant-Slug` header). Once authenticated, the JWT carries identity.
3. **Switching Tenants = Clean Session Wipe**: Switching stores requires a complete logout (clearing storage) followed by logging in with the new slug.

### Complete Auto-Refresh on HTTP 401
Implement automatic transparent token refresh using an Axios response interceptor with a mutex queue:

```typescript
// src/lib/auth-interceptor.ts
import axios from 'axios';
import { apiClient } from './api-client';
import { API_CONFIG } from '../config/api.config';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('billify_refresh_token');
      if (!refreshToken) {
        handleForcedLogout('Session expired. Please log in again.');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_CONFIG.baseURL}/api/v1/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem('billify_access_token', data.accessToken);
        localStorage.setItem('billify_refresh_token', data.refreshToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        handleForcedLogout('Your session has expired.');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleForcedLogout(message: string) {
  localStorage.removeItem('billify_access_token');
  localStorage.removeItem('billify_refresh_token');
  window.location.href = `/login?message=${encodeURIComponent(message)}`;
}
```

---

## 3. Standardized Error Handling Pattern

The backend responds with `{ "error": "message" }` for all 4xx/5xx responses. Map status codes to clear UI actions:

```typescript
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = (error.response?.data as { error?: string })?.error;

    if (serverMessage) return serverMessage;

    switch (status) {
      case 400:
        return 'Please review your input and try again.';
      case 401:
        return 'Invalid credentials or session expired.';
      case 403:
        return 'Access forbidden: You do not have permission or this account is suspended.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This record already exists or conflicts with current state.';
      case 429:
        return 'Too many attempts. Please wait a few moments before trying again.';
      case 500:
      default:
        return 'Something went wrong on our end. Please try again.';
    }
  }
  return 'A network error occurred. Please check your connection.';
}
```

---

## 4. Universal Grid Consumption — The Grid Pattern

### The Universal Contract
Every list or tabular query (`/api/v1/bills`, `/api/v1/returns`) adheres to the exact same pagination model:

#### Request Parameters
```
GET /api/v1/bills?Search=John&Page=1&PageSize=50&SortBy=CreatedAt&SortDir=desc
```
- `Search`: String (min 3 chars for server-side index search)
- `FromDate` / `ToDate`: ISO 8601 UTC strings (`2026-09-30T00:00:00Z`)
- `Page`: 1-based index (defaults to `1`)
- `PageSize`: Integer (default `50`, maximum `100`)
- `SortBy`: Field identifier (`CreatedAt`, `Total`, etc.)
- `SortDir`: `"asc"` | `"desc"`

#### Response Structure: `PagedResult<T>`
```json
{
  "items": [
    {
      "id": "e8b0a944-77ef-4ab0-8b1e-450f38b16cf2",
      "displayID": "000124",
      "primaryText": "Rahul Sharma",
      "secondaryText": "2 items • ₹3,000.00",
      "amount": 3000.00,
      "statusBadge": "Paid",
      "createdAt": "2026-09-30T06:15:00Z",
      "tags": ["UPI", "Cash"]
    }
  ],
  "totalCount": 342,
  "page": 1,
  "pageSize": 50,
  "totalPages": 7,
  "firstPage": 1,
  "lastPage": 7,
  "hasNext": true,
  "hasPrev": false,
  "isFirstPage": true,
  "isLastPage": false
}
```

### Complete React + TanStack Query Grid Component

```tsx
// src/components/DataGrid.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface GridItem {
  id: string;
  displayID: string;
  primaryText: string;
  secondaryText: string;
  amount?: number;
  statusBadge: string;
  createdAt: string;
  tags?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  firstPage: number;
  lastPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
}

interface DataGridProps<T extends GridItem> {
  endpoint: string;
  queryKey: string;
  columns: Array<{ header: string; render: (item: T) => React.ReactNode }>;
  onRowClick?: (item: T) => void;
}

export function DataGrid<T extends GridItem>({
  endpoint,
  queryKey,
  columns,
  onRowClick,
}: DataGridProps<T>) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [search, setSearch] = useState<string>('');

  const { data, isLoading, isError, error } = useQuery<PagedResult<T>>({
    queryKey: [queryKey, page, pageSize, search],
    queryFn: async () => {
      const params: Record<string, any> = { page, pageSize };
      if (search.trim().length >= 3) {
        params.search = search.trim();
      }
      const res = await apiClient.get<PagedResult<T>>(endpoint, { params });
      return res.data;
    },
    staleTime: 30_000, // 30s cache alignment with backend TTL
  });

  return (
    <div className="grid-container">
      {/* Search and Controls */}
      <div className="grid-controls">
        <input
          type="text"
          placeholder="Search (min 3 chars)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page
          }}
          className="search-input"
        />

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="pagesize-select"
        >
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Table Representation */}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={columns.length} className="loading-cell">
                Loading records...
              </td>
            </tr>
          )}
          {data?.items.map((item) => (
            <tr key={item.id} onClick={() => onRowClick?.(item)} className="cursor-pointer">
              {columns.map((col, idx) => (
                <td key={idx}>{col.render(item)}</td>
              ))}
            </tr>
          ))}
          {!isLoading && data?.items.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="empty-cell">
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Universal Pagination UX */}
      {data && (
        <div className="pagination-bar">
          <span className="summary-text">
            Showing {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount} records
          </span>

          <div className="pagination-actions">
            <button
              disabled={data.isFirstPage}
              onClick={() => setPage(data.firstPage)}
              className="btn-nav"
            >
              First
            </button>
            <button
              disabled={!data.hasPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-nav"
            >
              Previous
            </button>
            <span className="page-indicator">
              Page {data.page} of {data.totalPages || 1}
            </span>
            <button
              disabled={!data.hasNext}
              onClick={() => setPage((p) => p + 1))}
              className="btn-nav"
            >
              Next
            </button>
            <button
              disabled={data.isLastPage}
              onClick={() => setPage(data.lastPage)}
              className="btn-nav"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Reports & Analytics Consumption

- **Endpoint**: `GET /api/v1/reports/summary?FromDate=...&ToDate=...`
- **Cadence**: Recommended auto-refresh interval: **30 seconds** (matching server cache).
- **Date Handling**: Defaults to current day in Indian Standard Time (IST, UTC+5:30).

```typescript
export function useDashboardMetrics(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['reports', 'summary', fromDate, toDate],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/reports/summary', {
        params: { fromDate, toDate },
      });
      return res.data;
    },
    refetchInterval: 30_000, // Periodic KPI refresh
  });
}
```

---

## 6. Receipts & ESC/POS Printing

### 1. On-Screen Preview
Call `GET /api/v1/bills/{id}/receipt` to receive rich tax-compliant JSON data containing itemized CGST, SGST, discounts, and return policies.

### 2. Physical Thermal Printing via Web Bluetooth (ESC/POS)
The backend produces a ready-to-print ESC/POS byte sequence encoded in Base64:

```typescript
export async function printReceiptViaBluetooth(billId: string, width: 58 | 80 = 58) {
  // 1. Fetch ESC/POS Base64 payload from Billify API
  const { data } = await apiClient.get<{ payload: string }>(
    `/api/v1/bills/${billId}/receipt/thermal?Width=${width}`
  );

  // 2. Decode base64 to Uint8Array
  const binaryString = atob(data.payload);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 3. Connect to Bluetooth printer
  const device = await (navigator as any).bluetooth.requestDevice({
    filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
  });
  const server = await device.gatt.connect();
  const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
  const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

  // 4. Send raw ESC/POS bytes directly to printer
  await characteristic.writeValue(bytes);
}
```

### 3. WhatsApp Direct Receipt
```typescript
export async function sendReceiptViaWhatsApp(billId: string) {
  const { data } = await apiClient.get<{ whatsAppWebUrl: string }>(
    `/api/v1/bills/${billId}/receipt/whatsapp`
  );
  if (data.whatsAppWebUrl) {
    window.open(data.whatsAppWebUrl, '_blank');
  }
}
```

---

## 7. Settings Consumption (Partial Updates)

When editing settings, send **only the changed fields**:
```typescript
// Partial update: Only changing printer properties
await apiClient.put(`/api/v1/settings/printer/${shopId}`, {
  printerType: 'Thermal',
  printerName: 'EPSON-TM-T82',
});

// Partial update: Updating exchange policy days only
await apiClient.put(`/api/v1/settings/receipt/${shopId}`, {
  exchangePolicyDays: 14,
});
```

---

## 8. Code Examples & Recipes

### Create Bill with Multi-tender Payments
```typescript
export async function createBill(shopId: string, items: Array<{ itemName: string; qty: number; price: number; gstRate: number }>, payments: Array<{ mode: 'Cash' | 'UPI' | 'Card'; amount: number }>, negotiatedTotal?: number) {
  const payload = {
    shopID: shopId,
    items,
    payments,
    ...(negotiatedTotal ? { negotiatedTotal } : {}),
  };

  const response = await apiClient.post('/api/v1/bills', payload);
  return response.data;
}
```

---

## 9. Recommended Component Libraries
- **Data Tables**: [TanStack Table](https://tanstack.com/table) or [AG Grid](https://www.ag-grid.com/)
- **Form Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Server State**: [TanStack Query](https://tanstack.com/query)
- **UI State**: [Zustand](https://github.com/pmndrs/zustand)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
