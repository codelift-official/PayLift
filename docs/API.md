# Billify API Documentation

Welcome to the comprehensive API specification and developer reference for **Billify** — a high-performance, multi-tenant point-of-sale (POS) and billing API engine built with ASP.NET Core (.NET 10).

---

## 1. Overview

### Base URL Conventions
The API exposes two top-level route namespaces:
- **Tenant API**: `{host}/api/v1/...` — Used by store owners (BusinessAdmin), shop managers (Manager), and checkout cashiers (Staff).
- **Platform Management API**: `{host}/platform/...` — Used strictly by platform administrators and support staff.

### Content Negotiation
- **Request Format**: All requests containing payloads must specify `Content-Type: application/json`.
- **Response Format**: All responses are emitted as UTF-8 encoded `application/json` (or base64-encoded strings inside JSON for ESC/POS binary printer payloads).

### Authentication Protocol
- **Mechanism**: JWT Bearer token authentication via HTTP `Authorization: Bearer <access_token>`.
- **Stateless Tokens**: The access token contains signed claims establishing identity, tenancy, shop association, and permissions.

### Request Correlation & Tracing
- All requests accept or automatically receive an `X-Correlation-ID` header.
- If omitted by the caller, the API generates a unique GUID v4.
- The `X-Correlation-ID` is stamped onto all structured log events and echoed in response headers for distributed end-to-end debugging.

### Rate Limiting Policies
- **Tenant Login (`/api/v1/auth/login`)**: 5 attempts per 15 minutes per `IP + TenantSlug`.
- **Platform Login (`/platform/auth/login`)**: 3 attempts per 15 minutes per IP address.
- **Tenant Setup (`/api/v1/businesses/setup`)**: 3 attempts per hour per IP address.
- **Global Cache Purge (`/platform/cache/clear`)**: 1 call per 5 minutes per authenticated SuperAdmin.

---

## 2. Authentication Architecture

### Tenant Authentication Flow
```
1. Setup Business (Initial Owner):
   POST /api/v1/businesses/setup
   └── Creates Business + Default Shop + Owner User (Role: BusinessAdmin)

2. Login:
   POST /api/v1/auth/login
   Headers: X-Tenant-Slug: <tenant-slug>
   Body: { "tenant": "<slug>", "email": "...", "password": "..." }
   └── Returns AccessToken (JWT, 60m expiry) + RefreshToken (30d expiry)

3. Authenticated Requests:
   GET /api/v1/bills
   Headers: Authorization: Bearer <accessToken>
   (TenantID is read securely from JWT — never passed in body or query!)
```

### Platform Authentication Flow
```
1. Login:
   POST /platform/auth/login
   Body: { "email": "...", "password": "..." }
   └── Returns Platform AccessToken + RefreshToken

2. Platform Requests:
   GET /platform/businesses
   Headers: Authorization: Bearer <platformAccessToken>
```

### JWT Claims Reference

#### Tenant Token Claims
| Claim | Type | Description |
|---|---|---|
| `sub` | GUID | User ID (`Users.ID`) |
| `tenant_id` | Integer | Business Tenant ID (`Businesses.ID`) |
| `role` | String | `BusinessAdmin`, `Manager`, or `Staff` |
| `shop_id` | GUID (Optional) | Assigned Shop ID (present for `Manager` & `Staff`) |
| `email` | String | User's normalized email address |
| `jti` | GUID | Unique token identifier |

#### Platform Token Claims
| Claim | Type | Description |
|---|---|---|
| `sub` | GUID | Platform User ID (`PlatformUsers.ID`) |
| `platform_role` | String | `SuperAdmin`, `Support`, or `Billing` |
| `email` | String | Platform user's email address |
| `jti` | GUID | Unique token identifier |

> **Security Rule**: Tokens containing both `tenant_id` and `platform_role` or neither are rejected immediately with HTTP 401. Tenant tokens cannot access `/platform/*` (HTTP 403), and platform tokens cannot access tenant routes (HTTP 403).

---

## 3. Standardized Error Response Format

All 4xx and 5xx responses strictly adhere to a unified JSON contract:
```json
{
  "error": "Human-readable description of what went wrong"
}
```

### Common HTTP Status Codes
| HTTP Status | Meaning | Typical Scenario |
|---|---|---|
| **200 OK** | Success | Read, update, or successful query execution |
| **201 Created** | Resource Created | Business, shop, bill, return, or token created |
| **400 Bad Request** | Validation Error | Field validation failure, negative amount, invalid format |
| **401 Unauthorized** | Authentication Failure | Missing token, expired token, wrong password |
| **403 Forbidden** | Authorization Failure | Insufficient role, suspended business, cross-scope access |
| **404 Not Found** | Resource Missing | Nonexistent bill, shop, or cross-tenant query |
| **409 Conflict** | State Conflict | Duplicate business slug or existing unique entity |
| **429 Too Many Requests** | Rate Limit Exceeded | Exceeded allowed attempts within sliding/fixed window |
| **500 Internal Server Error** | Unexpected Server Error | Unhandled server exception (sanitized in production) |

---

## 4. Endpoint Reference

### A. Authentication Endpoints

#### POST /api/v1/auth/login
- **Auth:** Anonymous
- **Role:** n/a
- **Rate limit:** 5 per 15 min per IP + Tenant
- **Headers:** `X-Tenant-Slug: <slug>`
- **Body:**
```json
{
  "tenant": "fashion-hub",
  "email": "owner@fashionhub.com",
  "password": "Password123!"
}
```
- **Success (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "refreshToken": "7f8a9b...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "userID": "e8b0a944-...",
  "tenantID": 1,
  "role": "BusinessAdmin"
}
```
- **Errors:** 401 Unauthorized (`{"error":"Invalid credentials."}`), 429 Too Many Requests.
- **Notes:** Nonexistent tenant, wrong user, and incorrect password return the identical error to prevent enumeration.

#### POST /api/v1/auth/otp/send
- **Auth:** Anonymous
- **Role:** n/a
- **Rate limit:** AuthLogin policy
- **Body:** `{ "tenant": "fashion-hub", "mobile": "9876543210" }`
- **Success (200 OK):** `{ "message": "OTP sent successfully." }`
- **Errors:** 400 Bad Request, 401 Unauthorized.

#### POST /api/v1/auth/otp/verify
- **Auth:** Anonymous
- **Role:** n/a
- **Body:** `{ "tenant": "fashion-hub", "mobile": "9876543210", "otp": "123456" }`
- **Success (200 OK):** Returns standard `AuthResponse` with JWT token.
- **Errors:** 401 Unauthorized (`{"error":"Invalid or expired OTP."}`).

#### POST /api/v1/auth/refresh
- **Auth:** Anonymous
- **Role:** n/a
- **Body:** `{ "refreshToken": "raw_refresh_token_string" }`
- **Success (200 OK):** Returns fresh `AuthResponse`.
- **Errors:** 401 Unauthorized (`{"error":"Invalid refresh token."}`).
- **Notes:** Employs single-use token rotation. Old refresh token is revoked and linked via `ReplacedByID`.

#### POST /api/v1/auth/logout
- **Auth:** Required
- **Role:** Any tenant user
- **Body:** `{ "refreshToken": "raw_refresh_token_string" }`
- **Success (200 OK):** `{ "message": "Logged out successfully." }`

#### POST /api/v1/auth/forgot-password
- **Auth:** Anonymous
- **Role:** n/a
- **Body:** `{ "tenant": "fashion-hub", "email": "user@example.com" }`
- **Success (200 OK):** `{ "message": "If an account exists, a password reset link has been sent." }`
- **Notes:** Always returns 200 with the exact same message regardless of whether the business or email exists.

#### POST /api/v1/auth/reset-password
- **Auth:** Anonymous
- **Role:** n/a
- **Body:** `{ "tenant": "fashion-hub", "token": "hex_reset_token", "newPassword": "NewStrongPassword123!" }`
- **Success (200 OK):** `{ "message": "Password reset successfully." }`
- **Notes:** Invalidates all existing refresh tokens for that user on password reset.

---

### B. Business Setup

#### POST /api/v1/businesses/setup
- **Auth:** Anonymous
- **Role:** n/a
- **Rate limit:** 3 per hour per IP (`BusinessSetup`)
- **Body:**
```json
{
  "name": "Acme Retail",
  "slug": "acme-retail",
  "gst": "27AAAAA0000A1Z5",
  "ownerEmail": "admin@acmeretail.com",
  "ownerMobile": "9876543210",
  "ownerPassword": "StrongPassword123!"
}
```
- **Success (201 Created):**
```json
{
  "tenantID": 10,
  "name": "Acme Retail",
  "slug": "acme-retail",
  "ownerEmail": "admin@acmeretail.com",
  "ownerUserID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "defaultShopID": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "createdAt": "2026-09-30T06:00:00Z"
}
```
- **Errors:** 400 Bad Request, 409 Conflict (`{"error":"Slug is already taken."}`).

---

### C. Shops

#### POST /api/v1/shops/setup
- **Auth:** Required
- **Role:** `BusinessAdmin`
- **Body:**
```json
{
  "name": "Acme Mall Branch",
  "address": "Unit 402, High Street Mall",
  "mobile": "9876543210",
  "gst": "27AAAAA0000A1Z5",
  "logoUrl": "https://cdn.example.com/logo.png",
  "exchangePolicyDays": 7,
  "receiptFooter": "Thank you for shopping with Acme!",
  "printerType": "Thermal",
  "printerName": "EPSON-TM20",
  "whatsAppEnabled": true,
  "notificationEmail": "mall@acmeretail.com",
  "notificationSms": true
}
```
- **Success (201 Created):** Returns full `ShopResponse`.

#### GET /api/v1/shops
- **Auth:** Required
- **Role:** `BusinessAdmin` (all shops), `Manager`/`Staff` (assigned shop only)
- **Success (200 OK):** `[ { "id": "...", "name": "...", ... } ]`

#### GET /api/v1/shops/{id}
- **Auth:** Required
- **Role:** `BusinessAdmin`, or `Manager`/`Staff` assigned to that shop
- **Success (200 OK):** Returns `ShopResponse`.
- **Errors:** 404 Not Found (cross-tenant or wrong assignment).

#### PUT /api/v1/shops/{id}
- **Auth:** Required
- **Role:** `BusinessAdmin`
- **Body:** Same as `CreateShopRequest`.
- **Success (200 OK):** Returns updated `ShopResponse`. Invalidates shop cache.

---

### D. User Management

#### GET /api/v1/user/profile
- **Auth:** Required
- **Role:** Any tenant user
- **Success (200 OK):**
```json
{
  "userID": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "tenantID": 10,
  "email": "cashier@acmeretail.com",
  "mobile": "9876543210",
  "role": "Staff",
  "createdAt": "2026-09-30T06:00:00Z"
}
```

#### POST /api/v1/user/change-password
- **Auth:** Required
- **Role:** Any tenant user
- **Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "BrandNewPassword123!"
}
```
- **Success (200 OK):** `{ "message": "Password changed successfully. All active sessions have been revoked." }`
- **Notes:** Revokes all active refresh tokens for the calling user.

---

### E. Bills

#### POST /api/v1/bills
- **Auth:** Required
- **Role:** `BusinessAdmin`, `Manager`, `Staff`
- **Body:**
```json
{
  "shopID": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "negotiatedTotal": 2000,
  "items": [
    { "itemName": "Formal Shirt", "qty": 2, "price": 1200, "gstRate": 5 }
  ],
  "payments": [
    { "mode": "UPI", "amount": 1500 },
    { "mode": "Cash", "amount": 500 }
  ]
}
```
- **Success (201 Created):** Full `BillResponse` with computed GST and atomic sequential `billNumber`.
- **Notes:** Invalidates bills, payments, and reports grids for the tenant.

#### POST /api/v1/bills/quote
- **Auth:** Required
- **Role:** `BusinessAdmin`, `Manager`, `Staff`
- **Body:** Same as bill create without payments (calculates strict distribution and tax breakdown without persisting).
- **Success (200 OK):** Returns `BillQuoteResponse`.

#### GET /api/v1/bills
- **Auth:** Required
- **Role:** `BusinessAdmin` (all tenant bills), `Manager`/`Staff` (scoped to assigned shop)
- **Query Params:** `ShopID`, `Search`, `FromDate`, `ToDate`, `Page`, `PageSize`, `SortBy`, `SortDir`.
- **Success (200 OK):** Universal `PagedResult<BillSummaryResponse>`.
- **Notes:** Cached for 60s when `page <= 5` and search is >= 3 chars or empty.

#### GET /api/v1/bills/{id}
- **Auth:** Required
- **Success (200 OK):** Detailed `BillResponse` including all line items and payment records.

---

### F. Receipts

#### GET /api/v1/bills/{id}/receipt
- **Auth:** Required
- **Success (200 OK):** Structured JSON receipt with tax breakdown, CGST/SGST lines, payment breakdown, exchange policy days, and footer.

#### GET /api/v1/bills/{id}/receipt/thermal?Width=58 (or 80)
- **Auth:** Required
- **Success (200 OK):**
```json
{
  "billID": "...",
  "width": 58,
  "contentType": "application/octet-stream",
  "payload": "G0V4YW1wbG..."
}
```
- **Notes:** Contains ESC/POS byte sequence encoded in base64. Enforces word wrapping at 32 columns (58mm) or 48 columns (80mm).

#### GET /api/v1/bills/{id}/receipt/whatsapp
- **Auth:** Required
- **Success (200 OK):**
```json
{
  "billID": "...",
  "customerPhone": "9876543210",
  "messageText": "Invoice for Acme Retail...",
  "whatsAppWebUrl": "https://wa.me/919876543210?text=..."
}
```

---

### G. Returns & Exchanges

#### POST /api/v1/bills/{id}/returns
- **Auth:** Required
- **Role:** `BusinessAdmin`, `Manager`, `Staff`
- **Body:** `{ "items": [ { "itemName": "Formal Shirt", "qty": 1, "amount": 1000, "reason": "Defect" } ] }`
- **Success (201 Created):** `[ { "id": "...", "type": "Return", ... } ]`
- **Notes:** Enforces return quantity cannot exceed original bill quantity minus prior returns/exchanges.

#### POST /api/v1/bills/{id}/exchanges
- **Auth:** Required
- **Body:** Same as return. Sets `type: "Exchange"`.
- **Success (201 Created):** Returns list of `ReturnExchangeResponse`.

#### GET /api/v1/bills/{id}/returns
- **Auth:** Required
- **Success (200 OK):** Returns all historical return and exchange records for this bill.

#### GET /api/v1/returns
- **Auth:** Required
- **Query Params:** `ShopID`, `Search`, `FromDate`, `ToDate`, `Type` (`Return` or `Exchange`), `Page`, `PageSize`.
- **Success (200 OK):** Universal `PagedResult<ReturnSummaryResponse>`.

---

### H. Reports

#### GET /api/v1/reports/summary
- **Auth:** Required
- **Role:** `BusinessAdmin`, `Manager` (scoped to assigned shop)
- **Query Params:** `ShopID` (optional for admin), `FromDate`, `ToDate` (defaults to current date in IST).
- **Success (200 OK):**
```json
{
  "fromDate": "2026-09-30T00:00:00+05:30",
  "toDate": "2026-09-30T23:59:59.999+05:30",
  "totalSales": 5500.00,
  "totalBills": 3,
  "discounts": 0.00,
  "returns": 1200.00,
  "netSales": 4300.00,
  "cash": 800.00,
  "uPI": 2200.00,
  "card": 2500.00,
  "gstCollected": 275.00
}
```

---

### I. Settings (Config-driven Partial Updates)

#### PUT /api/v1/settings/printer/{shopId}
- **Auth:** Required (`BusinessAdmin`)
- **Body:** `{ "printerType": "Thermal", "printerName": "EPSON-TM20" }`
- **Success (200 OK):** Full updated `ShopResponse`.

#### PUT /api/v1/settings/notifications/{shopId}
- **Auth:** Required (`BusinessAdmin`)
- **Body:** `{ "whatsAppEnabled": true, "notificationEmail": "alerts@store.com", "notificationSms": false }`
- **Success (200 OK):** Full updated `ShopResponse`.

#### PUT /api/v1/settings/receipt/{shopId}
- **Auth:** Required (`BusinessAdmin`)
- **Body:** `{ "exchangePolicyDays": 10, "receiptFooter": "Goods once sold can be exchanged within 10 days." }`
- **Success (200 OK):** Full updated `ShopResponse`.
- **Notes:** `exchangePolicyDays` must be between 0 and 90.

---

### J. Cache Administration

#### POST /api/v1/cache/clear
- **Auth:** Required (`BusinessAdmin`)
- **Body:** `{ "confirm": "CLEAR" }`
- **Success (200 OK):** `{ "cleared": true, "tenantID": 10, "keysRemoved": 14 }`

#### GET /api/v1/cache/stats
- **Auth:** Required (`BusinessAdmin`)
- **Success (200 OK):** `{ "tenantKeys": 14, "gridBillsKeys": 2, "gridReturnsKeys": 1, "gridReportsKeys": 1 }`

---

### K. Platform Authentication

#### POST /platform/auth/login
- **Auth:** Anonymous
- **Rate limit:** 3 attempts per 15 minutes per IP (`PlatformLogin`)
- **Body:** `{ "email": "superadmin@billify.com", "password": "SuperSecretPassword123!" }`
- **Success (200 OK):** Returns `PlatformAuthResponse`.

#### POST /platform/auth/refresh
- **Auth:** Anonymous
- **Body:** `{ "refreshToken": "..." }`
- **Success (200 OK):** Returns fresh `PlatformAuthResponse`.

#### POST /platform/auth/logout
- **Auth:** Required (`PlatformUser`)
- **Body:** `{ "refreshToken": "..." }`
- **Success (200 OK):** `{ "message": "Logged out successfully." }`

---

### L. Platform Administration

#### GET /platform/businesses
- **Auth:** Required (`PlatformUser`)
- **Success (200 OK):** List of all businesses with shop/user counts.

#### GET /platform/businesses/{id}
- **Auth:** Required (`PlatformUser`)
- **Success (200 OK):** Detailed business metadata and settings.

#### POST /platform/businesses/{id}/suspend
- **Auth:** Required (`SuperAdmin` only)
- **Success (200 OK):** `{ "message": "Business suspended successfully." }`
- **Notes:** Immediate 403 enforcement for all tenant API calls.

#### POST /platform/businesses/{id}/activate
- **Auth:** Required (`SuperAdmin` only)
- **Success (200 OK):** `{ "message": "Business activated successfully." }`

#### GET /platform/metrics (and GET /metrics)
- **Auth:** Required (`SuperAdmin` only)
- **Success (200 OK):**
```json
{
  "ramBytes": 42104528,
  "threadCount": 24,
  "cacheEntries": 48,
  "cacheSizeBytes": 49152,
  "uptime": "2d 4h 12m 30s",
  "requestCount": 18452,
  "dbPoolStats": "Connected (Pool active)"
}
```

#### GET /platform/audit-logs
- **Auth:** Required (`SuperAdmin` only)
- **Success (200 OK):** List of all platform administrative actions.

#### POST /platform/cache/clear
- **Auth:** Required (`SuperAdmin` only)
- **Rate limit:** 1 call per 5 minutes (`PlatformCacheClear`)
- **Body:** `{ "confirm": "CLEAR-ALL" }`
- **Success (200 OK):** `{ "cleared": true, "keysRemoved": 150 }`

---

### M. System Health

#### GET /health
- **Auth:** Anonymous
- **Success (200 OK):**
```json
{
  "status": "Healthy",
  "version": "1.0.0",
  "timestamp": "2026-09-30T06:00:00Z",
  "db": true
}
```

---

## 5. Configuration Reference (`appsettings.json`)

| Configuration Key | Purpose | Default | Production Recommendation |
|---|---|---|---|
| `ConnectionStrings:Default` | SQL Server connection string | Local connection | Set via env var `ConnectionStrings__Default` or Azure Key Vault |
| `Jwt:Key` | HMAC-SHA256 signing secret | Empty in repo | 256-bit (>= 32 chars) cryptographic random secret from env var |
| `Jwt:Issuer` | JWT Issuer claim | `"BillifyApi"` | Canonical API domain name |
| `Jwt:Audience` | JWT Audience claim | `"BillifyApp"` | Canonical frontend client identifier |
| `Jwt:AccessTokenLifetimeMinutes` | Access token lifespan | `60` | 15–60 minutes |
| `Jwt:RefreshTokenLifetimeDays` | Refresh token lifespan | `30` | 14–30 days |
| `Cors:AllowedOrigins` | Allowed client origins | `["*"]` | Specify strict production domains (e.g. `https://pos.mybrand.com`) |
| `Cache:DefaultTtlSeconds` | In-memory cache default expiration | `600` (10m) | 300–600 seconds |
| `Cache:MaxSizeBytes` | Cache boundary size cap | `50000000` (50MB) | 50MB–250MB based on host RAM allocation |
| `Business:Setup:RateLimitPerHour` | Max business setups allowed per IP | `3` | 3–5 per hour to deter automated spam |
| `Platform:CacheClear:RateLimitPerMinute` | Global purge rate throttle | `0.2` (1 per 5m) | 0.2 per minute |
| `Cleanup:RunIntervalHours` | Background cleanup cadence | `6` | 4–6 hours |
| `Cleanup:AuditLogRetentionDays` | Platform audit log retention window | `90` | 90–365 days based on regulatory requirements |

---

## 6. Behavior Matrix

### Tenant Config-Driven Behavior
| Tenant Property | Default | System Impact & Effect |
|---|---|---|
| `StrictBillingMode` | `false` | When `true`, bills require `NegotiatedTotal` and compute proportional line item discounts. When `false`, items use explicit rate/discount. |
| `IsActive` | `true` | When `false`, all tenant API endpoints immediately reject requests with HTTP 403 Forbidden. |
| `ExchangePolicyDays` | `5` | Embedded in JSON receipts and printed on physical ESC/POS thermal paper. Enforced in return/exchange window validation. |
| `WhatsAppEnabled` | `false` | When `true`, returns pre-formatted wa.me URL for one-click receipt delivery. |

### Platform Roles & Permissions
| Role | Capabilities |
|---|---|
| `SuperAdmin` | Full read/write platform control: suspend/activate businesses, view platform metrics, purge global cache, view audit logs. |
| `Support` | Read-only platform control: browse businesses, shops, and error profiles. Cannot suspend accounts or clear cache. |
| `Billing` | Reserved for subscription tier assignments and merchant billing administration. |

---

## 7. Endpoint Access by Role Matrix

| Endpoint | BusinessAdmin | Manager | Staff | SuperAdmin | Support | Anonymous |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `POST /businesses/setup` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `POST /auth/login` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `POST /auth/refresh` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /user/profile` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /user/change-password` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /shops/setup` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /shops` | ✅ | ✅ (assigned) | ✅ (assigned) | ❌ | ❌ | ❌ |
| `POST /bills` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /bills/quote` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /bills` | ✅ (all) | ✅ (assigned) | ✅ (assigned) | ❌ | ❌ | ❌ |
| `GET /bills/{id}/receipt` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `POST /bills/{id}/returns` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `GET /reports/summary` | ✅ | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ |
| `PUT /settings/*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /cache/clear` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /platform/auth/login` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `GET /platform/businesses` | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| `POST /platform/businesses/*/suspend` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `GET /platform/metrics` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `POST /platform/cache/clear` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `GET /health` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 8. Rate Limit Policies

| Policy Name | Target Endpoints | Limit Window | Quota | Partition Key |
|---|---|---|---|---|
| `AuthLogin` | `/api/v1/auth/login`, `/auth/otp/*` | 15 Minutes | 5 attempts | `ClientIP : X-Tenant-Slug` |
| `PlatformLogin` | `/platform/auth/login` | 15 Minutes | 3 attempts | `ClientIP` |
| `BusinessSetup` | `/api/v1/businesses/setup` | 1 Hour | 3 setups | `ClientIP` |
| `PlatformCacheClear` | `/platform/cache/clear` | 5 Minutes | 1 purge | `PlatformUserID` (or `ClientIP`) |

---

## 9. Caching Reference

### What Is Cached
- **Grid Lists**: Paginated bills, returns, and payments queries (`page <= 5` and search length >= 3).
- **Reports**: Summary dashboard KPIs per tenant/shop/date-range.
- **Shop Configuration**: Full shop entity details and printer configurations.
- **Business Metadata**: Status and strict billing settings.

### Cache Key Formats
- `shop:{tenantID}:{shopID}` — Individual shop details.
- `shops:{tenantID}` — List of shops under a tenant.
- `user:profile:{userID}` — User profile information.
- `grid:{tenantID}:bills:{hash}` — Paginated bills list.
- `grid:{tenantID}:returns:{hash}` — Paginated returns list.
- `grid:{tenantID}:reports:{hash}` — Dashboard aggregate summary.

### Invalidation Triggers
- **On Bill Created**: Clears `grid:{tenantID}:bills:*`, `grid:{tenantID}:payments:*`, and `grid:{tenantID}:reports:*`.
- **On Return Created**: Clears `grid:{tenantID}:bills:*`, `grid:{tenantID}:returns:*`, `grid:{tenantID}:payments:*`, and `grid:{tenantID}:reports:*`.
- **On Shop Updated**: Clears `shop:{tenantID}:{shopID}` and `shops:{tenantID}`.
- **On Business Suspended/Activated**: Clears `business:{tenantID}` and `shops:{tenantID}`.
