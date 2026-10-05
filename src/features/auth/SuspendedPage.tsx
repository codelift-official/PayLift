import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Card } from '../../components/ui/Card';

export const SuspendedPage: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <Card
        className="w-full max-w-md p-6 sm:p-8 text-center space-y-6 shadow-modal border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Account suspended
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Your account has been suspended. This usually happens when a trial or
            grace period has ended.
          </p>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Contact support to reactivate your account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/contact"
            className="w-full sm:w-auto px-5 py-2.5 rounded-button text-white bg-primary hover:bg-primary-hover font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Support</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto px-5 py-2.5 rounded-button font-semibold text-sm border transition-all flex items-center justify-center space-x-2 hover:opacity-80"
            style={{
              borderColor: 'var(--bg-border)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
            }}
          >
            <LogOut className="w-4 h-4 text-danger" />
            <span>Logout</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
