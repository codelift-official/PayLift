import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlatformAuthStore } from '../store/platformAuthStore';
import { Loader2 } from 'lucide-react';

export const PlatformProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation();
  const isAuthenticated = usePlatformAuthStore((s) => s.isAuthenticated);
  const isHydrated = usePlatformAuthStore((s) => s.isHydrated);

  const user = usePlatformAuthStore((s) => s.user);

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center" data-testid="platform-hydrating-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuperAdmin = !!user && (user.role === 'SuperAdmin' || user.role === 'PlatformAdmin');

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/platform/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
