import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './app/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { OtpLoginPage } from './features/auth/OtpLoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { SetupPage } from './features/auth/SetupPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { BillsListPage } from './features/bills/BillsListPage';
import { NewBillPage } from './features/bills/NewBillPage';
import { BillDetailPage } from './features/bills/BillDetailPage';
import { ReturnsListPage } from './features/returns/ReturnsListPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
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

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/otp" element={<OtpLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/setup" element={<SetupPage />} />

      {/* Protected Standalone Routes (Full screen receipt preview without Shell Chrome) */}
      <Route
        path="/bills/:id/receipt"
        element={
          <ProtectedRoute>
            <ReceiptPreview />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes inside AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bills" element={<BillsListPage />} />
        <Route path="/bills/new" element={<NewBillPage />} />
        <Route path="/bills/:id" element={<BillDetailPage />} />
        <Route path="/returns" element={<ReturnsListPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/printer/:shopID" element={<PrinterSettingsPage />} />
        <Route path="/settings/notifications/:shopID" element={<NotificationSettingsPage />} />
        <Route path="/settings/receipt/:shopID" element={<ReceiptSettingsPage />} />
        <Route path="/settings/shop/:shopID" element={<ShopDetailsPage />} />
        <Route path="/settings/catalogs" element={<CatalogSettingsPage />} />
        <Route path="/settings/account/change-password" element={<ChangePasswordPage />} />
        {/* B2: Catalog routes — 3-level browsing */}
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
  );
};

export default App;
