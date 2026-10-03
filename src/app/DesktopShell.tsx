import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from '../components/nav/Sidebar';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { clsx } from 'clsx';

export const DesktopShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Activate desktop keyboard shortcuts (N, G+H, G+B, Esc)
  useKeyboardShortcuts();

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/bills/new')) return 'Create New Bill';
    if (pathname.startsWith('/bills/')) return 'Bill Details';
    if (pathname.startsWith('/bills')) return 'Bills & Invoices';
    if (pathname.startsWith('/returns')) return 'Returns & Exchanges';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/settings/account/change-password')) return 'Change Password';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Billify POS';
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Fixed Sidebar */}
      <Sidebar collapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />

      {/* Main Body (shifted by sidebar width) */}
      <div
        className={clsx(
          'flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out',
          isCollapsed ? 'ml-16' : 'ml-[240px]'
        )}
      >
        {/* Top Header (64px) */}
        <header
          className="sticky top-0 z-20 h-16 border-b border-border px-8 flex items-center justify-between shadow-card"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {getPageTitle(location.pathname)}
          </h1>
          <div className="flex items-center gap-2">
            {/* A6: Theme toggle in desktop header */}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate('/bills/new')}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-sm font-semibold rounded-button shadow-sm transition-all duration-150"
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
              New Bill
            </button>
          </div>
        </header>

        {/* A4: Full-width page content, no max-w-5xl constraint */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
