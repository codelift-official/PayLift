import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/auth.store';
import type { Role } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, user's role must be in this list or they are redirected */
  requiredRole?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const { isAuthenticated, isHydrated, hydrate, user } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access check
  if (requiredRole && requiredRole.length > 0) {
    const role = user?.role as Role | undefined;
    if (!role || !requiredRole.includes(role)) {
      // Show toast once on deny (use a stable key so it doesn't fire on every render)
      toast.error('Access denied', { id: 'rbac-denied' });
      // Redirect based on role
      const fallback = role === 'Staff' ? '/bills' : '/dashboard';
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};
