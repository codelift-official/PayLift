import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../../lib/errors';

const step1Schema = z.object({
  tenant: z.string().min(3, 'Tenant slug must be at least 3 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

const step2Schema = z.object({
  code: z.string().length(6, 'Enter 6-digit OTP code'),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

export const OtpLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setTokens, setUser, tenantSlug, setTenantSlug } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [tenant, setTenant] = useState(tenantSlug || '');
  const [mobile, setMobile] = useState('');

  const form1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      tenant: tenantSlug || '',
      mobile: '',
    },
  });

  const form2 = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (step === 2 && countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const onSendOtp = async (data: Step1Values) => {
    setLoading(true);
    try {
      setTenant(data.tenant);
      setMobile(data.mobile);
      setTenantSlug(data.tenant);

      await authApi.sendOtp({
        tenant: data.tenant,
        mobile: data.mobile,
      });

      toast.success('OTP sent to your mobile number');
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: Step2Values) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({
        tenant,
        mobile,
        code: data.code,
      });

      setTokens(res.accessToken, res.refreshToken);
      setUser({
        userID: res.userID,
        tenantID: res.tenantID,
        role: res.role,
        mobile,
      });

      toast.success('Verified successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loading) return;
    setLoading(true);
    try {
      await authApi.sendOtp({ tenant, mobile });
      toast.success('New OTP sent');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-[400px] shadow-raised bg-card border-border">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">OTP Login</h2>
            <p className="text-xs text-text-muted mt-1">
              {step === 1 ? 'Enter your mobile number' : `Enter code sent to +91 ${mobile}`}
            </p>
          </div>
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-text-muted hover:text-text-primary flex items-center"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Edit
            </button>
          )}
        </div>

        {step === 1 && (
          <form onSubmit={form1.handleSubmit(onSendOtp)} className="space-y-4">
            <Input
              label="Shop / Tenant Slug"
              placeholder="e.g. sharma-store"
              {...form1.register('tenant')}
              error={form1.formState.errors.tenant?.message}
            />

            <Input
              label="Registered Mobile Number"
              placeholder="9876543210"
              inputMode="numeric"
              maxLength={10}
              {...form1.register('mobile')}
              error={form1.formState.errors.mobile?.message}
            />

            <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
              Send OTP
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-text-muted hover:text-text-primary">
                Back to Password Login
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={form2.handleSubmit(onVerifyOtp)} className="space-y-4">
            <Input
              label="6-Digit OTP"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              {...form2.register('code')}
              error={form2.formState.errors.code?.message}
              rightElement={<KeyRound className="w-4 h-4 text-text-muted" />}
            />

            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                {canResend ? 'Didn’t get code?' : `Resend in ${countdown}s`}
              </span>
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={handleResend}
                className="font-semibold text-primary hover:underline disabled:opacity-40"
              >
                Resend OTP
              </button>
            </div>

            <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
              Verify & Login
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
