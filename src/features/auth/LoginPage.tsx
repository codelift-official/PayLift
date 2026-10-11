import { BrandMark } from '../../components/BrandMark';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Store,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore, type Role } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { VersionFooter } from '../../components/VersionFooter';
import { getApiErrorMessage } from '../../lib/errors';
import { getTimeGreeting } from '../../lib/greeting';

const loginSchema = z.object({
  tenant: z
    .string()
    .min(3, 'Shop slug must be at least 3 characters')
    .max(50, 'Shop slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(true),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser, setTenantSlug, tenantSlug } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign In';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenant: tenantSlug || 'sameer-mart',
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      if (data.rememberMe) {
        setTenantSlug(data.tenant);
      }

      const res = await authApi.login({
        tenant: data.tenant,
        email: data.email,
        password: data.password,
      });

      setTokens(res.accessToken, res.refreshToken);
      const userDisplayName = res.name || (data.email.toLowerCase().includes('staff') ? 'Staff' : 'Rishabh');
      setUser({
        userID: res.userID,
        tenantID: res.tenantID,
        role: (res.role as Role) || 'BusinessAdmin',
        name: userDisplayName,
        email: data.email,
        defaultShopID: res.defaultShopID ?? null,
        assignedShopIDs: res.assignedShopIDs ?? (res.defaultShopID ? [res.defaultShopID] : undefined),
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sahayak_session_greeted', 'true');
      }

      toast.success(getTimeGreeting(userDisplayName), {
        description: 'Welcome to Sahayak Business Platform',
      });

      const isStaffUser = res.role === 'Staff';
      const defaultRoute = isStaffUser ? '/bills/new' : '/dashboard';
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || defaultRoute;
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('credential')) {
        toast.error('Invalid credentials');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-3 pb-0 sm:px-6 sm:pt-6 sm:pb-0"
      style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Main Login Card with Centered Brand Inside */}
      <main className="w-full max-w-md">
        <Card className="p-5 sm:p-8 border border-border shadow-card backdrop-blur-md" style={{ backgroundColor: 'var(--bg-card)' }}>
                    {/* Brand Header inside Login Box */}
          <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
            <BrandMark size="lg" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted mt-1">
              Business Platform
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <Input
              label="Business"
              placeholder="e.g. sameer-mart"
              icon={<Store className="w-4 h-4 text-text-muted" />}
              {...register('tenant')}
              error={errors.tenant?.message}
              autoCapitalize="none"
              autoCorrect="off"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@store.com"
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

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer text-text-muted select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>Remember store</span>
              </label>
              <Link
                to="/forgot-password"
                className="font-medium text-text-muted hover:text-primary transition-colors"
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

      {/* Footer Legal, Platform Redirect & Version */}
      <footer className="w-full max-w-md pt-3 sm:pt-4 pb-1 sm:pb-2 flex flex-col items-center space-y-1.5 sm:space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Link
          to="/platform/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/70 hover:bg-card text-text-muted hover:text-text-primary font-medium text-xs transition-colors shadow-xs"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Platform Admin Login</span>
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

export default LoginPage;
