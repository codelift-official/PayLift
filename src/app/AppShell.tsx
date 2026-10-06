import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { MobileShell } from './MobileShell';
import { DesktopShell } from './DesktopShell';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth.store';
import { getTimeGreeting } from '../lib/greeting';

const routeTitles: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/bills/new', 'Create New Bill'],
  ['/bills/', 'Bill Details'],
  ['/bills', 'Bills & Invoices'],
  ['/returns', 'Returns & Exchanges'],
  ['/reports', 'Reports & Analytics'],
  ['/settings/catalogs', 'Catalog Configuration'],
  ['/settings/account/change-password', 'Change Password'],
  ['/settings', 'Settings'],
  ['/catalogs', 'Catalogs'],
];

export const AppShell: React.FC = () => {
  const { isMobile } = useResponsive();
  const location = useLocation();

  useEffect(() => {
    let title = 'Retail Billing & POS';
    for (const [route, t] of routeTitles) {
      if (location.pathname.startsWith(route)) {
        title = t;
        break;
      }
    }
    document.title = `${title} | Sahayak`;
  }, [location.pathname]);

  // Greet user once per tab session if authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasGreeted = sessionStorage.getItem('sahayak_session_greeted');
    const user = useAuthStore.getState().user;
    if (!hasGreeted && user) {
      sessionStorage.setItem('sahayak_session_greeted', 'true');
      toast.success(getTimeGreeting(user.name || user.email), {
        description: 'Welcome to Sahayak Business Platform',
      });
    }
  }, []);

  if (isMobile) {
    return <MobileShell />;
  }

  return <DesktopShell />;
};
