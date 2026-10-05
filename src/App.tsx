import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './stores/auth.store';
import { useSubscription } from './hooks/useSubscription';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Tenant Auth Pages
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { SetupPage } from './features/auth/SetupPage';
import { SuspendedPage } from './features/auth/SuspendedPage';

// Tenant App Pages
import { DashboardPage } from './features/dashboard/DashboardPage';
import { BillsListPage } from './features/bills/BillsListPage';
import { NewBillPage } from './features/bills/NewBillPage';
import { BillDetailPage } from './features/bills/BillDetailPage';
import { ReturnsListPage } from './features/returns/ReturnsListPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AccountPage } from './features/settings/AccountPage';
import { ChangePasswordPage } from './features/settings/ChangePasswordPage';
import { ReceiptPreview } from './features/receipts/ReceiptPreview';
import { PrinterSettingsPage } from './features/settings/PrinterSettingsPage';
import { NotificationSettingsPage } from './features/settings/NotificationSettingsPage';
import { ReceiptSettingsPage } from './features/settings/ReceiptSettingsPage';
import { ShopDetailsPage } from './features/settings/ShopDetailsPage';
import { CatalogsPage } from './features/catalogs/CatalogsPage';
import { CatalogCategoriesPage } from './features/catalogs/CatalogCategoriesPage';
import { CatalogProductsPage } from './features/catalogs/CatalogProductsPage';
import { CatalogSettingsPage } from './features/settings/CatalogSettingsPage';
import { ShopsPage } from './features/settings/ShopsPage';
import { ShopFormPage } from './features/settings/ShopFormPage';
import { UsersPage } from './features/settings/users/UsersPage';
import { UserFormPage } from './features/settings/users/UserFormPage';

// Legal & Support Pages
import { TermsPage } from './features/legal/TermsPage';
import { PrivacyPage } from './features/legal/PrivacyPage';
import { RefundPolicyPage } from './features/legal/RefundPolicyPage';
import { ContactPage } from './features/support/ContactPage';

// Platform Admin Pages
import { PlatformProtectedRoute } from './platform/components/PlatformProtectedRoute';
import { PlatformShell } from './platform/layout/PlatformShell';
import { PlatformLoginPage } from './platform/pages/PlatformLoginPage';
import { PlatformForgotPasswordPage } from './platform/pages/PlatformForgotPasswordPage';
import { PlatformResetPasswordPage } from './platform/pages/PlatformResetPasswordPage';
import { PlatformDashboard } from './platform/pages/PlatformDashboard';
import { BusinessListPage } from './platform/pages/BusinessListPage';
import { BusinessDetailPage } from './platform/pages/BusinessDetailPage';
import { DeploymentsPage } from './platform/pages/DeploymentsPage';
import { SupportTicketsPage } from './platform/pages/SupportTicketsPage';
import { AuditLogPage } from './platform/pages/AuditLogPage';
import { WhatsAppAdminPage } from './platform/pages/WhatsAppAdminPage';
import { WhatsAppSettingsPage } from './features/settings/whatsapp/WhatsAppSettingsPage';
import { WhatsAppDashboardPage } from './features/settings/whatsapp/WhatsAppDashboardPage';

// Phase 11 Pages
import { InventorySettingsPage } from './features/settings/inventory/InventorySettingsPage';
import { ProductsListPage } from './features/settings/products/ProductsListPage';
import { ProductFormPage } from './features/settings/products/ProductFormPage';
import { ProductCategoriesPage } from './features/settings/products/ProductCategoriesPage';
import { StockListPage } from './features/settings/stock/StockListPage';
import { BulkPurchasePage } from './features/settings/stock/BulkPurchasePage';
import { StockMovementsPage } from './features/settings/stock/StockMovementsPage';
import { CouponsListPage } from './features/settings/coupons/CouponsListPage';
import { CouponFormPage } from './features/settings/coupons/CouponFormPage';
import { CouponSettingsPage } from './features/settings/coupons/CouponSettingsPage';
import { CustomersListPage } from './features/settings/customers/CustomersListPage';
import { CustomerDetailPage } from './features/settings/customers/CustomerDetailPage';
import { OffersListPage } from './features/settings/offers/OffersListPage';
import { OfferFormPage } from './features/settings/offers/OfferFormPage';
import { OfferDetailPage } from './features/settings/offers/OfferDetailPage';
import { PlatformUsagePage } from './platform/pages/PlatformUsagePage';
import { PlatformTenantUsagePage } from './platform/pages/PlatformTenantUsagePage';
import { PlatformErrorLogPage } from './platform/pages/PlatformErrorLogPage';

/**
 * Redirect rule:
 * If subscription.status === 'Suspended' AND authenticated
 * AND current path NOT in [/contact, /login, /logout]
 * → redirect to /suspended
 */
const SubscriptionRedirectWatcher: React.FC = () => {
  const { status } = useSubscription();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && status && status.trim().toLowerCase() === 'suspended') {
      const allowedPaths = ['/contact', '/login', '/logout', '/suspended'];
      const isAllowed =
        allowedPaths.includes(location.pathname) ||
        location.pathname.startsWith('/platform');

      if (!isAllowed) {
        navigate('/suspended', { replace: true });
      }
    }
  }, [status, isAuthenticated, location.pathname, navigate]);

  return null;
};

export const App: React.FC = () => {
  return (
    <>
      <SubscriptionRedirectWatcher />
      <ReactQueryDevtools initialIsOpen={false} />
      <Routes>
        {/* Public Tenant Auth & Legal Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/register" element={<Navigate to="/setup" replace />} />
        <Route path="/suspended" element={<SuspendedPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Platform Super Admin Public Routes */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route path="/platform/forgot-password" element={<PlatformForgotPasswordPage />} />
        <Route path="/platform/reset-password" element={<PlatformResetPasswordPage />} />

        {/* Platform Super Admin Protected Routes */}
        <Route
          path="/platform"
          element={
            <PlatformProtectedRoute>
              <PlatformShell />
            </PlatformProtectedRoute>
          }
        >
          <Route index element={<PlatformDashboard />} />
          <Route path="businesses" element={<BusinessListPage />} />
          <Route path="businesses/:id" element={<BusinessDetailPage />} />
          <Route path="deployments" element={<DeploymentsPage />} />
          <Route path="usage" element={<PlatformUsagePage />} />
          <Route path="usage/:tenantID" element={<PlatformTenantUsagePage />} />
          <Route path="error-log" element={<PlatformErrorLogPage />} />
          <Route path="whatsapp" element={<WhatsAppAdminPage />} />
          <Route path="support" element={<SupportTicketsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
        </Route>

        {/* Protected Standalone Routes */}
        <Route
          path="/bills/:id/receipt"
          element={
            <ProtectedRoute>
              <ReceiptPreview />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes inside Tenant AppShell */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/bills" element={<BillsListPage />} />
          <Route path="/bills/new" element={<NewBillPage />} />
          <Route path="/bills/:id" element={<BillDetailPage />} />
          <Route path="/returns" element={<ReturnsListPage />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/account" element={<AccountPage />} />
          <Route path="/settings/printer" element={<PrinterSettingsPage />} />
          <Route path="/settings/printer/:shopID" element={<PrinterSettingsPage />} />
          <Route
            path="/settings/users"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/users/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <UserFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/whatsapp"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <WhatsAppSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/whatsapp/dashboard"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <WhatsAppDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/notifications/:shopID"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <NotificationSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/receipt"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ReceiptSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/receipt/:shopID"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ReceiptSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shop/:shopID"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/catalogs"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <CatalogSettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Inventory Settings */}
          <Route
            path="/settings/inventory"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <InventorySettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Products & Categories */}
          <Route
            path="/settings/products"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <ProductsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/products/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/products/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <ProductFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/product-categories"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <ProductCategoriesPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Stock */}
          <Route
            path="/settings/stock"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <StockListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/stock/bulk-purchase"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <BulkPurchasePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/stock/movements"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <StockMovementsPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Coupons */}
          <Route
            path="/settings/coupons"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <CouponsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/coupons/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <CouponFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/coupons/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <CouponFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/coupon-settings"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <CouponSettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Customers */}
          <Route
            path="/settings/customers"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <CustomersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/customers/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <CustomerDetailPage />
              </ProtectedRoute>
            }
          />
          {/* Phase 11: Offers */}
          <Route
            path="/settings/offers"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <OffersListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/offers/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <OfferFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/offers/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin', 'Manager']}>
                <OfferDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops/new"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/shops/:id"
            element={
              <ProtectedRoute requiredRole={['BusinessAdmin']}>
                <ShopFormPage />
              </ProtectedRoute>
            }
          />
          <Route path="/settings/account/change-password" element={<ChangePasswordPage />} />
          {/* B2: Catalog routes */}
          <Route path="/catalogs" element={<CatalogsPage />} />
          <Route path="/catalogs/:catalogId" element={<CatalogCategoriesPage />} />
          <Route path="/catalogs/:catalogId/categories/:categoryId" element={<CatalogProductsPage />} />
        </Route>

        {/* 404 Catch-all */}
        <Route
          path="*"
          element={
            <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center bg-app-bg">
              <h1 className="text-3xl font-bold text-text-primary mb-2">404 - Page Not Found</h1>
              <p className="text-text-muted mb-4">The requested page does not exist.</p>
              <a href="/dashboard" className="text-primary hover:underline font-semibold">
                Return to Dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </>
  );
};

export default App;
