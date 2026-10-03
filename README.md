# Billify — Modern Retail POS & Billing Frontend

Multi-tenant SaaS point-of-sale SPA built with React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, and Zustand.

## Desktop Chrome Architecture Choice
- **Desktop Chrome: Option A — SIDEBAR (Vyapar app style)**
- Retained consistently from Phase 1+2 across all desktop views (`>= 768px`).
- Features a fixed 240px sidebar (collapsible to 64px via `Cmd+\` / `Ctrl+\` or chevron toggle), top 64px header bar with page title and primary "New Bill" action, and zero bottom navigation or FAB on desktop.
- Mobile views (`< 768px`) use a fixed 64px bottom navbar with 5 core tabs (Home, Reports, Bills, Returns, Menu) and an elevated 64×64 red FAB for New Bill at 88px from the bottom.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server with MSW mock mode (default in dev)
npm run dev

# Build for production
npm run build
```

## MANDATORY INTEGRATION PHASE

Run once the backend API is available (local or staging):

1. Set `VITE_USE_MOCKS=false` in `.env`
2. Run every flow against the real API:
   - Login, refresh, logout, password change
   - Create bill, view list, view detail, quote
   - Receipt (structured), thermal bytes, WhatsApp link
   - Return, exchange
   - Reports
   - Settings updates
3. Compare real API responses to `api-types.ts`; fix drift
4. Verify thermal printing against a real Bluetooth printer
5. Confirm strict mode, multi-shop, all filters work
6. Either remove MSW or keep it for offline dev

Estimated: 1–2 days.
Do NOT ship to pilot without this pass.

## Blocked on Backend

- **B3 / C2: GST at Business Level**
  - Requires backend changes: new field `Businesses.GstRate` (decimal/percentage) and a migration strategy for existing bills.
  - Frontend status: NOT built. Removed `GstRate` editability from New Bill item rows, added TODO comments and disabled placeholder UI; GST calculation logic is not hardcoded and awaits backend settings.

- **C1: Server-Side Predefined & Custom Catalogs**
  - Currently implemented client-side with static JSON via `CatalogRepository` interface (`StaticCatalogRepository`).
  - Backend task for V2: store catalogs and categories server-side so they sync across devices and can be customized per tenant.

- **C3: Catalog Product Images Storage**
  - Needs image storage service and upload API (Cloudflare R2 free tier or S3-compatible storage recommended).
  - Frontend currently defaults product icons to Lucide icons and placeholder illustrations.

- **C4: Backend Partial Return API Validation**
  - Requires backend confirmation on `POST /bills/:id/returns` with partial quantity payload (e.g. returning qty=1 on a line item of qty=2).
  - Frontend is fully built with interactive quantity steppers, running totals, and remaining returnable quantity caps. If backend returns an error for partial returns in staging, backend coordination ticket must be opened.

- **C5: Catalog Configuration API (`/api/v1/settings/catalogs`)**
  - Currently persisted client-side in localStorage (`billify.enabledCatalogs.{tenantID}`) for V1.
  - Backend TODO: "Migrate to /api/v1/settings/catalogs when backend ready" so enabled catalogs and custom ordering persist centrally per tenant across all staff devices.
