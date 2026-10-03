import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../../lib/errors';

const resetSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetValues = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const tenant = searchParams.get('tenant') || '';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetValues) => {
    if (!token || !tenant) {
      toast.error('Invalid or missing password reset link');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        tenant,
        token,
        newPassword: data.newPassword,
      });

      toast.success('Password changed successfully. Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-[400px] shadow-raised bg-card border-border">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text-primary">Set New Password</h2>
          <p className="text-xs text-text-muted mt-1">
            Shop: <span className="font-semibold text-text-primary">{tenant || 'Unknown'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
            Update Password
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-text-muted hover:text-text-primary">
              Cancel & Return to Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
