import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/auth.store';

const forgotSchema = z.object({
  tenant: z.string().min(3, 'Tenant slug required'),
  email: z.string().email('Valid email required'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { tenantSlug } = useAuthStore();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      tenant: tenantSlug || '',
      email: '',
    },
  });

  const onSubmit = async (data: ForgotValues) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data);
    } catch {
      // API or security policy: always show success message regardless
    } finally {
      setLoading(false);
      setSubmitted(true);
      toast.success('Password reset instructions dispatched');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-[400px] shadow-raised bg-card border-border">
        {!submitted ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-primary">Reset Password</h2>
              <p className="text-xs text-text-muted mt-1">
                Enter your shop slug and email to receive reset instructions
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Shop / Tenant Slug"
                placeholder="e.g. sharma-store"
                {...register('tenant')}
                error={errors.tenant?.message}
              />

              <Input
                label="Registered Email"
                type="email"
                placeholder="owner@example.com"
                {...register('email')}
                error={errors.email?.message}
              />

              <Button type="submit" variant="primary" className="w-full py-2.5 mt-2" isLoading={loading}>
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-text-muted hover:text-text-primary">
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-success-soft text-success rounded-full flex items-center justify-center mx-auto mb-3">
              <MailCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">Check your inbox</h3>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              If an account matches that tenant and email, instructions to reset your password have been sent.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Return to Login
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};
