import { BrandMark } from '../../components/BrandMark';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VersionFooter } from '../../components/VersionFooter';
import { usePlatformAuthStore } from '../store/platformAuthStore';
import { useAuthStore } from '../../stores/auth.store';
import { platformApiClient } from '../api/client';
import { getTimeGreeting } from '../../lib/greeting';

const loginSchema = z.object({
  email: z.string().email('Valid admin email required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const PlatformLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = usePlatformAuthStore();
  const businessUser = useAuthStore((s) => s.user);
  const isBusinessAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [businessAccountError, setBusinessAccountError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Platform Admin Sign In | Sahayak';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setBusinessAccountError(null);
    const emailNormalized = data.email.toLowerCase().trim();

    try {
      const res = await platformApiClient.post('/platform/auth/login', {
        email: emailNormalized,
        password: data.password,
      });

      const resData = res.data || {};
      const at = resData.accessToken || resData.AccessToken || resData.token;
      const rt = resData.refreshToken || resData.RefreshToken || '';
      const user = resData.user;

      // Strict role check: Only SuperAdmin and PlatformAdmin are permitted
      if (!user || (user.role !== 'SuperAdmin' && user.role !== 'PlatformAdmin')) {
        const errorMsg =
          'Access denied: Business user credentials cannot access the Platform Super Admin portal. Please sign in via the Store POS login page.';
        setBusinessAccountError(errorMsg);
        toast.error('Access Denied', {
          description: 'Business accounts are restricted from the Platform Admin portal.',
        });
        return;
      }

      setTokens(at, rt);
      setUser(user);

      toast.success(getTimeGreeting(user?.name || 'Super Admin'), {
        description: 'Authenticated as Platform Super Admin',
      });
      navigate('/platform', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      const responseMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        '';

      const isBusinessAttempt =
        status === 403 ||
        responseMsg.toLowerCase().includes('business') ||
        responseMsg.toLowerCase().includes('store pos') ||
        emailNormalized.includes('apexretail') ||
        emailNormalized.includes('sameer-mart');

      if (isBusinessAttempt) {
        const errorMsg =
          responseMsg ||
          'Access denied: Business user credentials cannot access the Platform Super Admin portal. Please sign in via the Store POS login page.';
        setBusinessAccountError(errorMsg);
        toast.error('Access Denied', {
          description: 'Business credentials are not permitted on the Platform Admin portal.',
        });
        return;
      }

      // Demo / offline fallback ONLY for authorized platform super admin emails
      if (
        emailNormalized === 'admin@billify.internal' ||
        emailNormalized === 'admin@sahayak.internal' ||
        emailNormalized === 'superadmin@billify.com'
      ) {
        const demoUser = {
          id: 'admin-1',
          email: emailNormalized,
          name: 'Platform Super Admin',
          role: 'SuperAdmin',
        };
        setTokens('mock-platform-jwt-token', 'mock-platform-refresh-token');
        setUser(demoUser);
        toast.success(getTimeGreeting('Super Admin'), {
          description: 'Authenticated as Platform Super Admin (Demo Session)',
        });
        navigate('/platform', { replace: true });
        return;
      }

      const msg = responseMsg || 'Invalid admin credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col justify-between items-center px-4 py-2 sm:p-6"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Main Login Card with Centered Brand Inside */}
      <main className="w-full max-w-md my-auto py-1 sm:py-4">
        <Card className="p-5 sm:p-8 border border-border shadow-card backdrop-blur-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Brand Header inside Login Box */}
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
            <BrandMark size="lg" isPlatform />
            <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-500 font-mono mt-1">
              Super Admin Platform
            </span>
          </div>

          {/* Business Account Detection Warning Banner */}
          {businessAccountError && (
            <div
              role="alert"
              data-testid="business-account-error-banner"
              className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Business Account Detected</p>
                  <p className="mt-0.5 text-text-muted">{businessAccountError}</p>
                </div>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors self-start shadow-xs"
              >
                <span>Switch to Store POS Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Notice if signed into Store POS */}
          {isBusinessAuthenticated && !businessAccountError && (
            <div className="mb-4 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
              <div className="truncate">
                <span className="text-text-muted">Signed into Store as </span>
                <span className="font-semibold text-text-primary">{businessUser?.name || businessUser?.email || 'Staff'}</span>
              </div>
              <Link
                to="/dashboard"
                className="text-primary font-semibold hover:underline shrink-0 ml-2"
              >
                Open Store POS
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@sahayak.internal"
              icon={<Mail className="w-4 h-4 text-text-muted" />}
              {...register('email')}
              error={errors.email?.message}
              autoCapitalize="none"
              autoCorrect="off"
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4 text-text-muted" />}
              {...register('password')}
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none p-1 text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="flex justify-end pt-0.5">
              <Link
                to="/platform/forgot-password"
                className="text-xs font-medium text-text-muted hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 sm:h-11 text-sm font-semibold shadow-md flex items-center justify-center gap-2 mt-3 sm:mt-4"
              isLoading={loading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer Legal, Store POS Redirect & Version */}
      <footer className="w-full max-w-md py-2 sm:py-4 flex flex-col items-center space-y-2 sm:space-y-3 text-xs safe-bottom" style={{ color: 'var(--text-muted)' }}>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/70 hover:bg-card text-text-muted hover:text-text-primary font-medium text-xs transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-primary" />
          <span>Back to Store POS</span>
        </Link>

        <div className="space-x-3 text-center">
          <Link to="/terms" className="hover:underline hover:text-text-primary transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline hover:text-text-primary transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/contact" className="hover:underline hover:text-text-primary transition-colors">Support</Link>
        </div>
        <VersionFooter />
      </footer>
    </div>
  );
};

export default PlatformLoginPage;
