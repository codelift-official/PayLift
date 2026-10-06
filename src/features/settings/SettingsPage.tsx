import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/auth.store';
import {
  Store,
  Printer,
  Bell,
  Receipt,
  KeyRound,
  LogOut,
  ChevronRight,
  User,
  Loader2,
  Users,
  Package,
  Boxes,
  Layers,
  Ticket,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Reusable themed row component ────────────────────────────────
const SettingsRow: React.FC<{
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  dataTestId?: string;
}> = ({ to, icon, iconBg, iconColor, title, subtitle, badge, dataTestId }) => (
  <Link
    to={to}
    data-testid={dataTestId}
    className="px-5 py-3.5 flex items-center justify-between group transition-colors settings-row-link"
    style={{ color: 'inherit' }}
    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
  >
    <div className="flex items-center space-x-3">
      <div
        className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-semibold group-hover:text-primary transition-colors row-title" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          {badge}
        </div>
        {subtitle && (
          <p className="hidden sm:block text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
    </div>
    <ChevronRight className="w-4 h-4 group-hover:text-primary transition-colors" style={{ color: 'var(--text-muted)' }} />
  </Link>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenantSlug, logout } = useAuthStore();

  const role = user?.role || 'Staff';
  const isAdmin = role === 'BusinessAdmin';
  const isManager = role === 'Manager';

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.[0];
  const shopId = activeShop?.id || '';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Error logging out');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6" id="settings-page-container">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage business catalog, hardware, team, and security settings"
      />

      {/* Main Settings Section Card */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* ── ADMIN SECTION 1: Catalog & Management ── */}
            {isAdmin && (
              <>
                <SettingsRow
                  to="/settings/shops"
                  icon={<Store className="w-4 h-4" />}
                  iconBg="bg-violet-50 dark:bg-violet-950/30"
                  iconColor="text-violet-600"
                  title="Shops"
                  subtitle={`${shops?.length ?? 0} ${(shops?.length ?? 0) === 1 ? 'location' : 'locations'} configured`}
                  dataTestId="settings-row-shops"
                />

                <SettingsRow
                  to="/settings/users"
                  icon={<Users className="w-4 h-4" />}
                  iconBg="bg-teal-50 dark:bg-teal-950/30"
                  iconColor="text-teal-600"
                  title="Staff & Access"
                  subtitle="Manage team members & permissions"
                  dataTestId="settings-row-staff"
                />

                <SettingsRow
                  to="/settings/inventory"
                  icon={<Package className="w-4 h-4" />}
                  iconBg="bg-blue-50 dark:bg-blue-950/30"
                  iconColor="text-blue-600"
                  title="Inventory"
                  subtitle="Catalog mode & strict stock enforcement"
                  dataTestId="settings-row-inventory"
                />

                <SettingsRow
                  to="/settings/products"
                  icon={<Boxes className="w-4 h-4" />}
                  iconBg="bg-amber-50 dark:bg-amber-950/30"
                  iconColor="text-amber-600"
                  title="Products"
                  subtitle="Item pricing, barcodes & tax rates"
                  dataTestId="settings-row-products"
                />

                <SettingsRow
                  to="/settings/stock"
                  icon={<Layers className="w-4 h-4" />}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600"
                  title="Stock"
                  subtitle="Real-time quantities, alerts & purchases"
                  dataTestId="settings-row-stock"
                />

                <SettingsRow
                  to="/settings/customers"
                  icon={<User className="w-4 h-4" />}
                  iconBg="bg-pink-50 dark:bg-pink-950/30"
                  iconColor="text-pink-600"
                  title="Customers"
                  subtitle="Customer profiles & visit history"
                  dataTestId="settings-row-customers"
                />

                <SettingsRow
                  to="/settings/coupons"
                  icon={<Ticket className="w-4 h-4" />}
                  iconBg="bg-purple-50 dark:bg-purple-950/30"
                  iconColor="text-purple-600"
                  title="Coupons"
                  subtitle="Discount codes & stacking rules"
                  dataTestId="settings-row-coupons"
                />

                <SettingsRow
                  to="/settings/offers"
                  icon={<Megaphone className="w-4 h-4" />}
                  iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                  iconColor="text-indigo-600"
                  title="Offers"
                  subtitle="WhatsApp broadcast promotions"
                  dataTestId="settings-row-offers"
                />
              </>
            )}

            {/* ── MANAGER SECTION 1: Catalog & Customers ── */}
            {isManager && (
              <>
                <SettingsRow
                  to="/settings/products"
                  icon={<Boxes className="w-4 h-4" />}
                  iconBg="bg-amber-50 dark:bg-amber-950/30"
                  iconColor="text-amber-600"
                  title="Products"
                  subtitle="Item pricing, barcodes & tax rates"
                  dataTestId="settings-row-products"
                />

                <SettingsRow
                  to="/settings/stock"
                  icon={<Layers className="w-4 h-4" />}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600"
                  title="Stock"
                  subtitle="Real-time quantities, alerts & purchases"
                  dataTestId="settings-row-stock"
                />

                <SettingsRow
                  to="/settings/customers"
                  icon={<User className="w-4 h-4" />}
                  iconBg="bg-pink-50 dark:bg-pink-950/30"
                  iconColor="text-pink-600"
                  title="Customers"
                  subtitle="Customer profiles & visit history"
                  dataTestId="settings-row-customers"
                />

                <SettingsRow
                  to="/settings/coupons"
                  icon={<Ticket className="w-4 h-4" />}
                  iconBg="bg-purple-50 dark:bg-purple-950/30"
                  iconColor="text-purple-600"
                  title="Coupons"
                  subtitle="Discount codes & stacking rules"
                  dataTestId="settings-row-coupons"
                />

                <SettingsRow
                  to="/settings/offers"
                  icon={<Megaphone className="w-4 h-4" />}
                  iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                  iconColor="text-indigo-600"
                  title="Offers"
                  subtitle="WhatsApp broadcast promotions"
                  dataTestId="settings-row-offers"
                />
              </>
            )}

            {/* ── HARDWARE & COMMUNICATIONS SECTION ── */}
            {/* Printer is visible to ALL roles (Admin, Manager, Staff) */}
            <SettingsRow
              to={shopId ? `/settings/printer/${shopId}` : '/settings/printer'}
              icon={<Printer className="w-4 h-4" />}
              iconBg="bg-emerald-50 dark:bg-emerald-950/30"
              iconColor="text-success"
              title="Printer"
              subtitle={`${activeShop?.printerType || 'Thermal'} • ${activeShop?.printerName || 'Bluetooth ESC/POS'}`}
              dataTestId="settings-row-printer"
            />

            {/* Notifications & Receipt: Admin only */}
            {isAdmin && (
              <>
                <SettingsRow
                  to={shopId ? `/settings/notifications/${shopId}` : '/settings/notifications'}
                  icon={<Bell className="w-4 h-4" />}
                  iconBg="bg-purple-50 dark:bg-purple-950/30"
                  iconColor="text-purple-600"
                  title="Notifications"
                  subtitle="WhatsApp receipts & email sales reports"
                  dataTestId="settings-row-notifications"
                />

                <SettingsRow
                  to={shopId ? `/settings/receipt/${shopId}` : '/settings/receipt'}
                  icon={<Receipt className="w-4 h-4" />}
                  iconBg="bg-amber-50 dark:bg-amber-950/30"
                  iconColor="text-amber-600"
                  title="Receipt"
                  subtitle={`${activeShop?.exchangePolicyDays || 7} days exchange • Custom footer note`}
                  dataTestId="settings-row-receipt"
                />
              </>
            )}

            {/* ── ACCOUNT SECTION ── */}
            {/* Account is visible to ALL roles */}
            <SettingsRow
              to="/settings/account"
              icon={<User className="w-4 h-4" />}
              iconBg="bg-indigo-50 dark:bg-indigo-950/30"
              iconColor="text-indigo-600 dark:text-indigo-400"
              title="Account"
              subtitle="Data export, system version & business details"
              dataTestId="settings-row-account"
            />

            {/* Change Password: Admin only in the settings list */}
            {isAdmin && (
              <SettingsRow
                to="/settings/account/change-password"
                icon={<KeyRound className="w-4 h-4" />}
                iconBg="bg-slate-100 dark:bg-slate-800"
                iconColor="text-slate-600 dark:text-slate-300"
                title="Change Password"
                subtitle="Update your sign-in password"
                dataTestId="settings-row-change-password"
              />
            )}

            {/* ── LOGOUT (red, last row for ALL roles) ── */}
            <button
              type="button"
              id="settings-logout-btn"
              onClick={handleLogout}
              className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 text-danger transition-colors font-semibold text-sm text-left group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-danger flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="row-title">Logout</span>
              </div>
              <ChevronRight className="w-4 h-4 text-danger/50 group-hover:text-danger transition-colors" />
            </button>
          </div>
        )}
      </Card>

      {/* Account Info Details Card */}
      <Card className="border-border shadow-card p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center" style={{ color: 'var(--text-muted)' }}>
          <User className="w-3.5 h-3.5 mr-1.5" /> Account Details
        </h3>
        <div className="space-y-0 divide-y divide-border text-xs sm:text-sm">
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Shop Slug</span>
            <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{tenantSlug || 'kirana-mart'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email || 'admin@kiranamart.com'}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span style={{ color: 'var(--text-muted)' }}>Role</span>
            <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{user?.role || 'Staff'}</span>
          </div>
        </div>
      </Card>

      {/* Legal Footer Links */}
      <div className="text-center text-xs space-x-3 pt-2" style={{ color: 'var(--text-muted)' }}>
        <Link to="/terms" className="hover:underline">Terms</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
        <span>·</span>
        <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
      </div>
    </div>
  );
};
