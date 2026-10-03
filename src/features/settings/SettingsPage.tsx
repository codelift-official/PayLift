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
  Shield,
  User,
  Loader2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenantSlug, logout } = useAuthStore();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.[0];
  const shopId = activeShop?.id || '11111111-1111-1111-1111-111111111111';

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
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Manage hardware, store configuration, and terminal account"
      />

      {/* Terminal / Store Settings */}
      <Card className="bg-white border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
            <Store className="w-3.5 h-3.5 mr-1.5" />
            Store & Hardware Configuration
          </h3>
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Shop Details */}
            <Link
              to={`/settings/shop/${shopId}`}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    Shop Details
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeShop?.name || 'Kirana Mart'} • {activeShop?.mobile || 'Store Phone'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>

            {/* Printer Settings */}
            <Link
              to={`/settings/printer/${shopId}`}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-success flex items-center justify-center">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    Printer Settings
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeShop?.printerType || 'Thermal'} • {activeShop?.printerName || 'Bluetooth ESC/POS'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>

            {/* Notification Settings */}
            <Link
              to={`/settings/notifications/${shopId}`}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    Notification Settings
                  </p>
                  <p className="text-xs text-text-muted">
                    WhatsApp receipts & email sales reports
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>

            {/* Receipt Settings */}
            <Link
              to={`/settings/receipt/${shopId}`}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    Receipt Settings
                  </p>
                  <p className="text-xs text-text-muted">
                    {activeShop?.exchangePolicyDays || 7} days exchange • Custom footer note
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>

            {/* Catalog Configuration (Admin) */}
            <Link
              to="/settings/catalogs"
              className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-primary flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                      Catalog Configuration
                    </p>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    Enable, disable & reorder bill checkout catalogs
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
            </Link>
          </div>
        )}
      </Card>

      {/* Account Info */}
      <Card className="bg-white border-border shadow-card p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
          <User className="w-3.5 h-3.5 mr-1.5" /> Account Details
        </h3>
        <div className="space-y-2.5 text-xs sm:text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-text-muted">Shop Slug</span>
            <span className="font-mono font-bold text-text-primary">{tenantSlug || 'kirana-mart'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-text-muted">Email</span>
            <span className="font-semibold text-text-primary">{user?.email || 'admin@kiranamart.com'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-text-muted">Role</span>
            <span className="font-semibold text-text-primary capitalize">{user?.role || 'BusinessAdmin'}</span>
          </div>
        </div>
      </Card>

      {/* Security & Logout Actions */}
      <Card className="bg-white border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-slate-50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1.5" /> Security & Session
          </h3>
        </div>

        <div className="divide-y divide-border">
          <Link
            to="/settings/account/change-password"
            className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <KeyRound className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                Change Password
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-red-50 text-danger transition-colors font-semibold text-sm text-left"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
};
