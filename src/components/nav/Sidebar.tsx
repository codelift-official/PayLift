import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { navItemsForRole } from './navItems';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { toast } from 'sonner';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggle = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleCollapse]);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Role-filtered nav items
  const items = navItemsForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  // Keyboard shortcut: Cmd+\ or Ctrl+\ to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <aside
      className={clsx(
        'fixed top-0 bottom-0 left-0 z-30 border-r border-border flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-hidden select-none',
        isCollapsed ? 'w-16' : 'w-[240px]'
      )}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Top Brand / Logo */}
      <div className={clsx(
        'h-16 flex items-center border-b border-border',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-rose-600 to-red-700 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-red-500/20 shrink-0">
                S
              </div>
              <span className="font-bold text-lg tracking-tight text-text-primary truncate">
                Sahayak
              </span>
            </div>
            <button
              type="button"
              onClick={toggle}
              title="Collapse sidebar (Ctrl+\)"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 via-rose-600 to-red-700 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-red-500/20 shrink-0">
            S
          </div>
        )}
      </div>

      {/* Middle Navigation Items */}
      <nav className={clsx(
        'flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                clsx(
                  'flex items-center rounded-button text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2.5 space-x-3 w-full',
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-muted hover:text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Expand Button when collapsed */}
      {isCollapsed && (
        <div className="py-2 border-t border-border flex justify-center">
          <button
            type="button"
            onClick={toggle}
            title="Expand sidebar (Ctrl+\)"
            className="w-10 h-10 rounded-button flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom User Area & Standard Logout */}
      <div className={clsx('border-t border-border', isCollapsed ? 'p-2' : 'p-3')}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 cursor-default"
              title={`${user?.email || 'Store User'} (${user?.role || 'Staff'})`}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="w-10 h-10 rounded-button flex items-center justify-center text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center rounded-button p-2 space-x-2.5 border border-border"
            style={{ backgroundColor: 'var(--bg-app)' }}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {user?.email || 'Store Staff'}
              </p>
              <p className="text-[10px] text-text-muted truncate capitalize">
                {user?.role || 'Staff'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
