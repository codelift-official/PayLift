import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, Settings, LogOut } from 'lucide-react';
import { BottomNav } from '../components/nav/BottomNav';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuthStore } from '../stores/auth.store';
import { toast } from 'sonner';

export const MobileShell: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Mobile Header (56px) */}
      <header
        className="sticky top-0 z-30 h-14 border-b border-border px-4 flex items-center justify-between safe-top"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            B
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>Billify</span>
        </div>
        <div className="flex items-center space-x-0.5">
          {/* A6: Theme toggle in mobile header */}
          <ThemeToggle />
          <button
            type="button"
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-full text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content — pb-20 clears bottom nav (64px) + FAB overhang */}
      {/* A4: Reduced padding from p-4 to p-3 for density */}
      <main className="flex-1 p-3 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* A3: Bottom Nav with centered FAB (no separate FloatingActionButton) */}
      <BottomNav />
    </div>
  );
};
