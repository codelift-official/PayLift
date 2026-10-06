import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VersionFooter } from '../../components/VersionFooter';
import { usePlatformAuthStore } from '../store/platformAuthStore';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

      toast.success(getTimeGreeting(user?.name || 'Rishabh'), {
        description: 'Authenticated as Platform Super Admin',
      });
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

  return (
    <div
      className="min-h-screen min-h-[100dvh] flex flex-col justify-between items-center p-4 sm:p-6"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Main Login Card with Centered Brand Inside */}
      <main className="w-full max-w-md my-auto py-4">
        <Card className="p-6 sm:p-8 border border-border shadow-card backdrop-blur-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Brand Header inside Login Box - S icon and Sahayak in same line */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
              S
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary leading-tight">
                Sahayak
              </h1>
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                Platform Admin
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              className="w-full h-11 text-sm font-semibold shadow-md flex items-center justify-center gap-2 mt-4"
              isLoading={loading}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </main>

      {/* Footer Legal, Store POS Redirect & Version */}
      <footer className="w-full max-w-md py-4 flex flex-col items-center space-y-3 text-xs safe-bottom" style={{ color: 'var(--text-muted)' }}>
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
