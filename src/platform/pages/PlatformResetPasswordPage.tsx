import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { platformApiClient } from '../api/client';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export const PlatformResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetFormData) => {
    setLoading(true);
    try {
      await platformApiClient.post('/platform/auth/reset-password', {
        token,
        password: data.password,
      });
      toast.success('Password successfully reset. Please sign in.');
      navigate('/platform/login', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Password reset failed. Token may have expired.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Create a secure password for your Super Admin account
        </p>
      </div>

      <Card
        className="w-full max-w-sm p-6 sm:p-8 shadow-card border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none p-1"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            className="w-full py-2.5 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-semibold"
            isLoading={loading}
          >
            Update Password
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/platform/login"
              className="inline-flex items-center text-xs font-semibold hover:underline"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
