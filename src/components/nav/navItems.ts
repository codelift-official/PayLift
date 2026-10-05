import { Home, BarChart3, Receipt, Undo2, Menu, Printer, LucideIcon } from 'lucide-react';
import type { Role } from '../../stores/auth.store';

export interface NavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  path: string;
}

/** All available nav items */
const ALL_NAV_ITEMS: NavItem[] = [
  { key: 'home',    icon: Home,     label: 'Home',    path: '/dashboard' },
  { key: 'reports', icon: BarChart3, label: 'Reports', path: '/reports' },
  { key: 'bills',   icon: Receipt,   label: 'Bills',   path: '/bills' },
  { key: 'returns', icon: Undo2,     label: 'Returns', path: '/returns' },
  { key: 'printer', icon: Printer,   label: 'Printer', path: '/settings/printer' },
  { key: 'more',    icon: Menu,      label: 'Menu',    path: '/settings' },
];

/**
 * Returns the appropriate nav items for a given role.
 *
 * BusinessAdmin / Manager: Home, Reports, Bills, Returns, Menu
 * Staff:                   Bills, Returns, Printer, Menu
 */
export function navItemsForRole(role: Role | string | undefined | null): NavItem[] {
  if (role === 'Staff') {
    return ALL_NAV_ITEMS.filter((i) =>
      ['bills', 'returns', 'printer', 'more'].includes(i.key)
    );
  }
  // BusinessAdmin or Manager
  return ALL_NAV_ITEMS.filter((i) =>
    ['home', 'reports', 'bills', 'returns', 'more'].includes(i.key)
  );
}

/** Legacy flat export kept for backwards compat */
export const navItems: NavItem[] = navItemsForRole('BusinessAdmin');
