import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { MobileShell } from './MobileShell';
import { DesktopShell } from './DesktopShell';

export const AppShell: React.FC = () => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <MobileShell />;
  }

  return <DesktopShell />;
};
