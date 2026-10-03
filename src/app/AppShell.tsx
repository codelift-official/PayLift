import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import { MobileShell } from './MobileShell';
import { DesktopShell } from './DesktopShell';

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
    document.title = `${title} | Billify`;
  }, [location.pathname]);

  if (isMobile) {
    return <MobileShell />;
  }

  return <DesktopShell />;
};
