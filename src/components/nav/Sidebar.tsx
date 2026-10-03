import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from './navItems';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

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
        'fixed top-0 bottom-0 left-0 z-30 bg-white border-r border-border flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-[240px]'
      )}
    >
      {/* Top Brand / Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              B
            </div>
            <span className="font-bold text-lg tracking-tight text-text-primary truncate">
              Billify
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-primary flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            B
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          title={isCollapsed ? 'Expand sidebar (Ctrl+\\)' : 'Collapse sidebar (Ctrl+\\)'}
          className={clsx(
            'p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors',
            isCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
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
                    : 'text-text-muted hover:text-text-primary hover:bg-slate-50'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button when collapsed */}
      {isCollapsed && (
        <div className="p-2 border-t border-border flex justify-center">
          <button
            type="button"
            onClick={toggle}
            title="Expand sidebar (Ctrl+\)"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom User Area */}
      <div className="p-3 border-t border-border">
        <div
          className={clsx(
            'flex items-center rounded-button bg-slate-50 p-2',
            isCollapsed ? 'justify-center' : 'space-x-3'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-text-muted shrink-0">
            <User className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {user?.email || 'Store Staff'}
              </p>
              <p className="text-[11px] text-text-muted truncate capitalize">
                {user?.role || 'Cashier'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
