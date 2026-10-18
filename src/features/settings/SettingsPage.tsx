import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/auth.store';
import {
  Store,
  Building2,
  Printer,
  Bell,
  Receipt,
  KeyRound,
  LogOut,
  ChevronRight,
  User,
  Loader2,
  Users,
  Boxes,
  Layers,
  Ticket,
  Megaphone,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

// Reusable themed row component
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
    <div className="flex items-center space-x-3.5 min-w-0">
      <div
        className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-semibold group-hover:text-primary transition-colors row-title truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        )}
      </div>
    </div>
    <ChevronRight className="w-4 h-4 shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--text-muted)' }} />
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
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8" id="settings-page-container">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Configure store locations, POS billing policies, hardware, and access controls"
      />

      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: STORE & ENTERPRISE POLICIES */}
          {isAdmin && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Building2 className="w-3.5 h-3.5 text-primary" /> Store & Business Configuration
              </h2>
              <Card className="border-border shadow-card overflow-hidden divide-y divide-border" style={{ backgroundColor: 'var(--bg-card)' }}>
                <SettingsRow
                  to="/settings/shops"
                  icon={<Store className="w-4 h-4" />}
                  iconBg="bg-violet-50 dark:bg-violet-950/30"
                  iconColor="text-violet-600"
                  title="Shops & Outlets"
                  subtitle={`${shops?.length ?? 0} ${(shops?.length ?? 0) === 1 ? 'branch' : 'branches'} configured`}
                  dataTestId="settings-row-shops"
                />

                <SettingsRow
                  to={shopId ? `/settings/shop/${shopId}` : '/settings/shop'}
                  icon={<Store className="w-4 h-4" />}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600"
                  title="Shop Settings"
                  subtitle="Branch GST, POS checkout rules, rounding & customer policies"
                  dataTestId="settings-row-shop"
                />

                <SettingsRow
                  to="/settings/business"
                  icon={<Building2 className="w-4 h-4" />}
                  iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                  iconColor="text-indigo-600"
                  title="Business Settings"
                  subtitle="Enterprise parameters, strict stock mode & coupon stacking"
                  dataTestId="settings-row-business"
                />

                <SettingsRow
                  to="/settings/users"
                  icon={<Users className="w-4 h-4" />}
                  iconBg="bg-teal-50 dark:bg-teal-950/30"
                  iconColor="text-teal-600"
                  title="Staff & Permissions"
                  subtitle="Manage cashiers, managers & role-based access"
                  dataTestId="settings-row-staff"
                />
              </Card>
            </div>
          )}

          {/* SECTION 2: CATALOG & INVENTORY OPERATIONS (Admin & Manager) */}
          {(isAdmin || isManager) && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Boxes className="w-3.5 h-3.5 text-amber-500" /> Catalog & Inventory
              </h2>
              <Card className="border-border shadow-card overflow-hidden divide-y divide-border" style={{ backgroundColor: 'var(--bg-card)' }}>
                <SettingsRow
                  to="/settings/products"
                  icon={<Boxes className="w-4 h-4" />}
                  iconBg="bg-amber-50 dark:bg-amber-950/30"
                  iconColor="text-amber-600"
                  title="Products Catalog"
                  subtitle="Item pricing, barcodes, HSN codes & tax rates"
                  dataTestId="settings-row-products"
                />

                <SettingsRow
                  to="/settings/stock"
                  icon={<Layers className="w-4 h-4" />}
                  iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                  iconColor="text-emerald-600"
                  title="Stock & Inventory"
                  subtitle="Real-time quantities, inward purchases & stock movements"
                  dataTestId="settings-row-stock"
                />
              </Card>
            </div>
          )}

          {/* SECTION 3: CUSTOMERS & PROMOTIONS (Admin & Manager) */}
          {(isAdmin || isManager) && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Ticket className="w-3.5 h-3.5 text-pink-500" /> Customers & Marketing
              </h2>
              <Card className="border-border shadow-card overflow-hidden divide-y divide-border" style={{ backgroundColor: 'var(--bg-card)' }}>
                <SettingsRow
                  to="/settings/customers"
                  icon={<User className="w-4 h-4" />}
                  iconBg="bg-pink-50 dark:bg-pink-950/30"
                  iconColor="text-pink-600"
                  title="Customers Directory"
                  subtitle="Customer profiles, phone directory & purchase history"
                  dataTestId="settings-row-customers"
                />

                <SettingsRow
                  to="/settings/coupons"
                  icon={<Ticket className="w-4 h-4" />}
                  iconBg="bg-purple-50 dark:bg-purple-950/30"
                  iconColor="text-purple-600"
                  title="Coupons & Discounts"
                  subtitle="Promo codes, minimum cart rules & discount caps"
                  dataTestId="settings-row-coupons"
                />

                <SettingsRow
                  to="/settings/offers"
                  icon={<Megaphone className="w-4 h-4" />}
                  iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                  iconColor="text-indigo-600"
                  title="Offers & Broadcasts"
                  subtitle="Promotional marketing & WhatsApp announcements"
                  dataTestId="settings-row-offers"
                />
              </Card>
            </div>
          )}

          {/* SECTION 4: HARDWARE, PRINTER & RECEIPTS (All Roles / Admin) */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Printer className="w-3.5 h-3.5 text-emerald-500" /> Peripherals & Printing
            </h2>
            <Card className="border-border shadow-card overflow-hidden divide-y divide-border" style={{ backgroundColor: 'var(--bg-card)' }}>
              {/* Printer: Available to all users to configure local machine hardware */}
              <SettingsRow
                to={shopId ? `/settings/printer/${shopId}` : '/settings/printer'}
                icon={<Printer className="w-4 h-4" />}
                iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                iconColor="text-success"
                title="Printer Setup"
                subtitle={`${activeShop?.printerType || 'Thermal'} • ${activeShop?.printerName || 'Bluetooth ESC/POS'}`}
                dataTestId="settings-row-printer"
              />

              {isAdmin && (
                <>
                  <SettingsRow
                    to={shopId ? `/settings/receipt/${shopId}` : '/settings/receipt'}
                    icon={<Receipt className="w-4 h-4" />}
                    iconBg="bg-amber-50 dark:bg-amber-950/30"
                    iconColor="text-amber-600"
                    title="Receipt Template"
                    subtitle={`${activeShop?.exchangePolicyDays || 14} days exchange policy • Custom footer note`}
                    dataTestId="settings-row-receipt"
                  />

                  <SettingsRow
                    to={shopId ? `/settings/notifications/${shopId}` : '/settings/notifications'}
                    icon={<Bell className="w-4 h-4" />}
                    iconBg="bg-purple-50 dark:bg-purple-950/30"
                    iconColor="text-purple-600"
                    title="Notifications & E-Receipts"
                    subtitle="WhatsApp digital receipts & daily automated sales email"
                    dataTestId="settings-row-notifications"
                  />
                </>
              )}
            </Card>
          </div>

          {/* SECTION 5: ACCOUNT & SECURITY */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider px-1 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Account & Security
            </h2>
            <Card className="border-border shadow-card overflow-hidden divide-y divide-border" style={{ backgroundColor: 'var(--bg-card)' }}>
              <SettingsRow
                to="/settings/account"
                icon={<User className="w-4 h-4" />}
                iconBg="bg-indigo-50 dark:bg-indigo-950/30"
                iconColor="text-indigo-600 dark:text-indigo-400"
                title="Account Details"
                subtitle="Data export, system version & business profile"
                dataTestId="settings-row-account"
              />

              {isAdmin && (
                <SettingsRow
                  to="/settings/account/change-password"
                  icon={<KeyRound className="w-4 h-4" />}
                  iconBg="bg-slate-100 dark:bg-slate-800"
                  iconColor="text-slate-600 dark:text-slate-300"
                  title="Change Password"
                  subtitle="Update your sign-in credentials"
                  dataTestId="settings-row-change-password"
                />
              )}

              {/* Logout Button */}
              <button
                type="button"
                id="settings-logout-btn"
                onClick={handleLogout}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition-colors font-semibold text-sm text-left group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="row-title">Sign Out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-500/50 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </Card>
          </div>

          {/* Account Info Details Card */}
          <Card className="border-border shadow-card p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Smartphone className="w-3.5 h-3.5 text-primary" /> Active Workspace Profile
            </h3>
            <div className="space-y-0 divide-y divide-border text-xs sm:text-sm">
              <div className="flex justify-between py-2.5">
                <span style={{ color: 'var(--text-muted)' }}>Tenant Domain Slug</span>
                <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{tenantSlug || 'apex-retail'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span style={{ color: 'var(--text-muted)' }}>Authorized Account</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.email || 'admin@apexretail.com'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span style={{ color: 'var(--text-muted)' }}>Access Role</span>
                <span className="font-semibold capitalize px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                  {user?.role || 'Staff'}
                </span>
              </div>
            </div>
          </Card>

          {/* Legal Footer Links */}
          <div className="text-center text-xs space-x-3 pt-2" style={{ color: 'var(--text-muted)' }}>
            <Link to="/terms" className="hover:underline hover:text-primary transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:underline hover:text-primary transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/refund-policy" className="hover:underline hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
