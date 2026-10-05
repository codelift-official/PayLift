import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { platformApiClient } from '../api/client';

const forgotSchema = z.object({
  email: z.string().email('Valid admin email required'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export const PlatformForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true);
    try {
      await platformApiClient.post('/platform/auth/forgot-password', {
        email: data.email,
      });
      toast.success('Password reset instructions sent if email exists.');
      setSubmitted(true);
    } catch {
      toast.success('Password reset instructions sent if email exists.');
      setSubmitted(true);
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
        <h1 className="text-2xl font-bold tracking-tight">Platform Recovery</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Reset your Super Admin credentials
        </p>
      </div>

      <Card
        className="w-full max-w-sm p-6 sm:p-8 shadow-card border"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
        }}
      >
        {submitted ? (
          <div className="text-center space-y-4 py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Check Your Inbox</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              If an admin account is linked to this address, you will receive password reset instructions.
            </p>
            <Link
              to="/platform/login"
              className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to Admin Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-bold">Forgot Password</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Enter your administrative email to receive a recovery link
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@billify.internal"
                {...register('email')}
                error={errors.email?.message}
                autoCapitalize="none"
              />

              <Button
                type="submit"
                className="w-full py-2.5 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 font-semibold"
                isLoading={loading}
              >
                Send Recovery Link
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
          </>
        )}
      </Card>
    </div>
  );
};
