import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/PageHeader';
import { getApiErrorMessage } from '../../lib/errors';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    setLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Password changed. Logged out.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <PageHeader
        title="Change Password"
        subtitle="Manage your terminal credentials"
        showBack
        backTo="/settings"
      />

      <Card className="bg-card border-border shadow-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
          />

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

          <div className="pt-2 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/settings')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Save New Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
