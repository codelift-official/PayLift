import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { usePlatformAuthStore } from '../platform/store/platformAuthStore';

interface ImpersonationData {
  platform_at: string;
  platform_rt: string;
  platform_user: any;
  businessId: string | number;
  businessName: string;
}

export const ImpersonationBanner: React.FC = () => {
  const navigate = useNavigate();
  const [impersonation, setImpersonation] = useState<ImpersonationData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('platform_imp_backup');
      if (raw) {
        setImpersonation(JSON.parse(raw));
      } else {
        setImpersonation(null);
      }
    } catch {
      setImpersonation(null);
    }
  }, []);

  if (!impersonation) {
    return null;
  }

  const handleExit = () => {
    try {
      const raw = localStorage.getItem('platform_imp_backup');
      if (raw) {
        const data: ImpersonationData = JSON.parse(raw);
        // Restore platform tokens
        localStorage.setItem('platform_at', data.platform_at || '');
        localStorage.setItem('platform_rt', data.platform_rt || '');
        localStorage.setItem('platform_user', JSON.stringify(data.platform_user || null));
        usePlatformAuthStore.getState().hydrate();

        // Clear impersonation token from tenant storage
        localStorage.removeItem('platform_imp_backup');
        useAuthStore.getState().logout();

        navigate(`/platform/businesses/${data.businessId}`, { replace: true });
        return;
      }
    } catch {
      // Fallback
    }
    navigate('/platform', { replace: true });
  };

  return (
    <div
      role="banner"
      className="w-full px-4 py-2 bg-red-600 text-white text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-md z-40 relative"
    >
      <div className="flex items-center space-x-2 truncate">
        <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
        <span className="truncate">
          Impersonating {impersonation.businessName}. All actions logged.
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wider shrink-0 transition-opacity hover:opacity-90 shadow-xs flex items-center space-x-1"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: '#DC2626',
        }}
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Exit Impersonation</span>
      </button>
    </div>
  );
};
