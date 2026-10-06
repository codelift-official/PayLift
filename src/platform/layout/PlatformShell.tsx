import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  LifeBuoy,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePlatformAuthStore } from '../store/platformAuthStore';
import { ThemeToggle } from '../../components/ui/ThemeToggle';

export const PlatformShell: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = usePlatformAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out from Platform Admin');
    navigate('/platform/login', { replace: true });
  };

  const navItems = [
    { to: '/platform', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/platform/businesses', label: 'Businesses', icon: Building2 },
    { to: '/platform/usage', label: 'Usage', icon: BarChart3 },
    { to: '/platform/error-log', label: 'Error Log', icon: ShieldAlert },
    { to: '/platform/whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { to: '/platform/deployments', label: 'Deployments', icon: GitBranch },
    { to: '/platform/support', label: 'Support', icon: LifeBuoy },
    { to: '/platform/audit', label: 'Audit', icon: ShieldAlert },
  ];

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/platform') return 'Platform Overview';
    if (pathname.startsWith('/platform/businesses/')) return 'Business Management';
    if (pathname.startsWith('/platform/businesses')) return 'All Tenants';
    if (pathname.startsWith('/platform/usage')) return 'Tenant Resource Usage';
    if (pathname.startsWith('/platform/error-log')) return 'System Error Logs';
    if (pathname.startsWith('/platform/whatsapp')) return 'WhatsApp Admin';
    if (pathname.startsWith('/platform/deployments')) return 'System Deployments';
    if (pathname.startsWith('/platform/support')) return 'Support Tickets';
    if (pathname.startsWith('/platform/audit')) return 'Security Audit Log';
    return 'Platform Super Admin';
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: 240px desktop, drawer on mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[240px] flex flex-col border-r transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
        }}
      >
        {/* Brand / Logo */}
        <div
          className="h-16 px-5 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Sahayak Admin
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-500">
                Super Admin
              </span>
            </div>
          </div>
          <button
            type="button"
            className="p-1 rounded-md lg:hidden hover:opacity-80"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white dark:bg-zinc-700 shadow-xs'
                    : 'hover:opacity-80 hover:bg-[var(--bg-app)]'
                }`}
                style={!isActive ? { color: 'var(--text-muted)' } : undefined}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer: Version, User Info, Logout */}
        <div
          className="p-3 border-t shrink-0 space-y-2"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          {/* Version in Platform Shell */}
          <div className="px-3.5 py-1 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            v1.0.0 · Prod
          </div>

          <div
            className="px-3 py-2 rounded-lg flex items-center justify-between text-xs"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <div className="truncate pr-2">
              <p className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.email || 'admin@sahayak.internal'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2 rounded-lg text-sm font-medium text-danger hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-[240px]">
        {/* Top Header */}
        <header
          className="sticky top-0 z-30 h-16 border-b px-4 lg:px-8 flex items-center justify-between shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--bg-border)',
          }}
        >
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg lg:hidden hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg lg:text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className="hidden sm:inline-block text-xs font-mono px-2.5 py-1 rounded border"
              style={{
                borderColor: 'var(--bg-border)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-muted)',
              }}
            >
              {user?.email || 'admin@sahayak.internal'}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
