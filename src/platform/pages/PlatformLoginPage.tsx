import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, Clock, ArrowRight, ArrowLeft, Sparkles, Terminal } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { usePlatformAuthStore } from '../store/platformAuthStore';
import { platformApiClient } from '../api/client';

const loginSchema = z.object({
  email: z.string().email('Valid admin email required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const PlatformLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = usePlatformAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    document.title = 'Super Admin Sign In | Billify';
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
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
    try {
      const res = await platformApiClient.post('/platform/auth/login', {
        email: data.email,
        password: data.password,
      });

      const resData = res.data || {};
      const at = resData.accessToken || resData.AccessToken || resData.token;
      const rt = resData.refreshToken || resData.RefreshToken || '';
      const user = resData.user || { email: data.email, role: 'SuperAdmin' };

      setTokens(at, rt);
      setUser(user);

      toast.success('Authenticated as Platform Super Admin');
      navigate('/platform', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Invalid admin credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setValue('email', 'codelift.official@gmail.com', { shouldValidate: true });
    setValue('password', 'Sahayak27Sept', { shouldValidate: true });
    toast.info('Filled Platform Admin credentials');
  };

  return (
    <div
      className="min-h-screen min-h-[100dvh] relative overflow-x-hidden flex flex-col justify-between items-center p-4 sm:p-6"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '7s' }} />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '9s' }} />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 safe-top">
        <Link
          to="/login"
          className="inline-flex items-center text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Store POS
        </Link>

        <div className="flex items-center space-x-2.5">
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            <span>Platform Core Live</span>
          </div>

          {currentTime && (
            <div className="hidden md:flex items-center space-x-1 text-xs font-mono text-text-muted px-2 py-1 rounded-lg bg-card/80 border border-border">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currentTime}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Main Form */}
      <main className="w-full max-w-sm my-auto py-4">
        {/* Brand Icon */}
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20 border border-border">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Control</h1>
          <p className="text-xs mt-1 text-text-muted">
            Multi-tenant infrastructure & subscription console
          </p>
        </div>

        <Card
          className="w-full p-6 sm:p-7 shadow-raised border border-border bg-card/95 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold">Admin Sign In</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Authorized super administrators only
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              title="Auto-fill Platform Credentials"
              className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-full transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Demo Admin</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@billify.internal"
              icon={<Mail className="w-4 h-4 text-text-muted" />}
              {...register('email')}
              error={errors.email?.message}
              autoCapitalize="none"
            />

            <Input
              label="Secret Password"
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

            <div className="flex justify-end pt-1">
              <Link
                to="/platform/forgot-password"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white"
              isLoading={loading}
            >
              <Terminal className="w-4 h-4" />
              <span>Authenticate Console</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl py-3 flex flex-col items-center space-y-1.5 text-xs text-text-muted safe-bottom">
        <p className="text-[11px] opacity-75">
          Billify Cloud Infrastructure · Protected by End-to-End Tenancy Isolation
        </p>
      </footer>
    </div>
  );
};
