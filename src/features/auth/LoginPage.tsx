import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../../lib/errors';
import { checkApiHealth } from '../../lib/apiStatus';

const loginSchema = z.object({
  tenant: z
    .string()
    .min(3, 'Tenant slug must be at least 3 characters')
    .max(50, 'Tenant slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
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
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  React.useEffect(() => {
    document.title = 'Sign In | Billify POS';
    checkApiHealth().then((ok) => setBackendOnline(ok));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenant: tenantSlug || '',
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
      setUser({
        userID: res.userID,
        tenantID: res.tenantID,
        role: res.role,
        email: data.email,
      });

      toast.success('Logged in successfully');

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
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
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-raised">
          B
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Billify</h1>
        <p className="text-xs text-text-muted mt-1">Multi-tenant Retail Billing & POS</p>
      </div>

      {backendOnline === false && (
        <div className="mb-4 max-w-[400px] w-full p-2.5 rounded-card bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs text-center font-medium">
          Backend server is currently starting up / under maintenance.
        </div>
      )}

      <Card className="w-full max-w-[400px] shadow-raised bg-card border-border">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">Welcome back</h2>
          <p className="text-xs text-text-muted mt-1">Sign in to your shop terminal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Shop / Tenant Slug"
            placeholder="e.g. sharma-store"
            {...register('tenant')}
            error={errors.tenant?.message}
            autoCapitalize="none"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="owner@example.com"
            {...register('email')}
            error={errors.email?.message}
            autoCapitalize="none"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none p-1 text-text-muted hover:text-text-primary"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-text-muted select-none">
              <input
                type="checkbox"
                {...register('rememberMe')}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span>Remember shop slug</span>
            </label>

            <Link
              to="/forgot-password"
              className="font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
            Login
          </Button>

          <div className="pt-3 border-t border-border text-center space-y-2">
            <Link
              to="/login/otp"
              className="text-xs font-semibold text-text-primary hover:text-primary transition-colors block"
            >
              Login with Mobile OTP →
            </Link>

            <Link
              to="/setup"
              className="text-xs text-text-muted hover:text-text-primary transition-colors block"
            >
              First time here? <span className="font-semibold text-primary">Setup Business</span>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
