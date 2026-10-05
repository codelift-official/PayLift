import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  Receipt,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Lock,
  Mail,
  ArrowRight,
  Printer,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore, type Role } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { VersionFooter } from '../../components/VersionFooter';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
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
  const [activeTab, setActiveTab] = useState<'store' | 'customer'>('store');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Live Real-Time Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Customer bill lookup state
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerBillId, setCustomerBillId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign In | Billify POS';
    checkApiHealth().then((ok) => setBackendOnline(ok));

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
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
        role: (res.role as Role) || 'BusinessAdmin',
        email: data.email,
        defaultShopID: res.defaultShopID ?? null,
      });

      toast.success('Terminal session initialized');

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('credential')) {
        toast.error('Invalid tenant, email, or password credentials');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillApex = () => {
    setValue('tenant', 'apex-retail', { shouldValidate: true });
    setValue('email', 'admin@apexretail.com', { shouldValidate: true });
    setValue('password', 'Password1!', { shouldValidate: true });
    toast.info('Filled Apex Retail credentials');
  };

  const handleCustomerLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerBillId.trim()) {
      toast.error('Please enter your Bill / Invoice ID');
      return;
    }
    setLookupLoading(true);
    setTimeout(() => {
      setLookupLoading(false);
      navigate(`/bills/${customerBillId.trim()}/receipt`);
    }, 400);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-x-hidden flex flex-col justify-between items-center p-4 sm:p-6" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Top Floating App Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 safe-top">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-primary/20">
            B
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight block leading-tight">Billify</span>
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider block">POS & Retail OS</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Live System Status Pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>API Live v1.0.3</span>
          </div>

          {/* Real-time Clock */}
          {currentTime && (
            <div className="hidden md:flex items-center space-x-1 text-xs font-mono text-text-muted px-2 py-1 rounded-lg bg-card/80 border border-border">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{currentDate ? `${currentDate} · ` : ''}{currentTime}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Container */}
      <main className="w-full max-w-md my-auto py-4">
        {/* Backend Status Warning */}
        {backendOnline === false && (
          <div className="mb-4 w-full p-3 rounded-card bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs text-center font-medium flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Backend services are connecting or warming up...
          </div>
        )}

        {/* Tab Switcher: Store Terminal vs Customer Bills */}
        <div className="flex p-1 mb-4 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'store'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Store Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'customer'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Customer Invoices</span>
          </button>
        </div>

        {/* Card Body */}
        <Card className="p-6 sm:p-7 shadow-raised border border-border bg-card/95 backdrop-blur-md">
          {activeTab === 'store' ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text-primary">Shop Sign In</h2>
                  <p className="text-xs text-text-muted mt-0.5">Authenticate terminal cashier or admin</p>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFillApex}
                  title="Auto-fill Demo Credentials"
                  className="px-2.5 py-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Apex Demo</span>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Shop / Tenant Slug"
                  placeholder="e.g. apex-retail"
                  icon={<Store className="w-4 h-4 text-text-muted" />}
                  {...register('tenant')}
                  error={errors.tenant?.message}
                  autoCapitalize="none"
                />

                <Input
                  label="User Email Address"
                  type="email"
                  placeholder="admin@apexretail.com"
                  icon={<Mail className="w-4 h-4 text-text-muted" />}
                  {...register('email')}
                  error={errors.email?.message}
                  autoCapitalize="none"
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

                <div className="flex items-center justify-between text-xs pt-1">
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
                    className="font-medium text-text-muted hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                  isLoading={loading}
                >
                  <span>Launch POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Live Micro-features Ticker */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1 bg-border/60 px-2 py-0.5 rounded-full">
                    <Printer className="w-3 h-3 text-indigo-500" /> Thermal Print
                  </span>
                  <span className="flex items-center gap-1 bg-border/60 px-2 py-0.5 rounded-full">
                    <Percent className="w-3 h-3 text-emerald-500" /> Auto 18% GST
                  </span>
                  <span className="flex items-center gap-1 bg-border/60 px-2 py-0.5 rounded-full">
                    <Store className="w-3 h-3 text-purple-500" /> Multi-Shop
                  </span>
                </div>

                {/* Footer links */}
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">Register a new store?</span>
                    <Link
                      to="/setup"
                      className="font-semibold text-primary hover:underline transition-colors"
                    >
                      Setup Business &rarr;
                    </Link>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-border" />
                    <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-text-muted tracking-widest">
                      Platform Control
                    </span>
                    <div className="flex-grow border-t border-border" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/platform/login')}
                    className="w-full h-10 text-xs font-semibold flex items-center justify-center gap-2 border-border hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    Platform Super Admin
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-5">
                <h2 className="text-xl font-bold tracking-tight text-text-primary">Customer Invoice Portal</h2>
                <p className="text-xs text-text-muted mt-0.5">Lookup and verify your digital store receipt</p>
              </div>

              <form onSubmit={handleCustomerLookup} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">Customer Mobile Number</label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 absolute left-3 text-text-muted pointer-events-none" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9834671940"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-input border border-border bg-input text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <span className="text-[11px] text-text-muted">Optional: helps verify invoice ownership</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-primary">Bill / Invoice ID *</label>
                  <div className="relative flex items-center">
                    <FileText className="w-4 h-4 absolute left-3 text-text-muted pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={customerBillId}
                      onChange={(e) => setCustomerBillId(e.target.value)}
                      placeholder="e.g. BILL-2026-001 or UUID"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-input border border-border bg-input text-text-primary focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2"
                  isLoading={lookupLoading}
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Digital Invoice</span>
                </Button>

                <div className="p-3 rounded-lg bg-border/40 border border-border text-xs text-text-muted flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Bills generated in Billify include verifiable QR codes, GST breakdown, and store merchant details.</span>
                </div>
              </form>
            </div>
          )}
        </Card>
      </main>

      {/* Footer Legal & Versioning */}
      <footer className="w-full max-w-4xl py-3 flex flex-col items-center space-y-2 text-xs safe-bottom" style={{ color: 'var(--text-muted)' }}>
        <div className="space-x-3 text-center">
          <Link to="/terms" className="hover:underline hover:text-text-primary transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline hover:text-text-primary transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/refund-policy" className="hover:underline hover:text-text-primary transition-colors">Refund Policy</Link>
          <span>·</span>
          <Link to="/contact" className="hover:underline hover:text-text-primary transition-colors">Support & Contact</Link>
        </div>
        <div className="text-[11px] opacity-80">
          <VersionFooter />
        </div>
      </footer>
    </div>
  );
};
