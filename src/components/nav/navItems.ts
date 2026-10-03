import { Home, BarChart3, Receipt, Undo2, Menu, LucideIcon } from 'lucide-react';

export interface NavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  path: string;
}

export const navItems: NavItem[] = [
  { key: 'home', icon: Home, label: 'Home', path: '/dashboard' },
  { key: 'reports', icon: BarChart3, label: 'Reports', path: '/reports' },
  { key: 'bills', icon: Receipt, label: 'Bills', path: '/bills' },
  { key: 'returns', icon: Undo2, label: 'Returns', path: '/returns' },
  { key: 'more', icon: Menu, label: 'Menu', path: '/settings' },
];
