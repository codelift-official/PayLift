import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Mail, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { VersionFooter } from '../../components/VersionFooter';
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
      className="min-h-screen min-h-[100dvh] flex flex-col justify-between items-center p-4 sm:p-6"
      style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}
    >
      <main className="w-full max-w-md my-auto py-4">
        <Card className="p-6 sm:p-8 border border-border shadow-card backdrop-blur-md" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Brand Header inside Box */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
              S
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary leading-tight">
                Sahayak
              </h1>
              <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
                Platform Recovery
              </span>
            </div>
          </div>

          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold">Check Your Inbox</h2>
              <p className="text-xs text-text-muted">
                If an admin account is linked to this address, you will receive password reset instructions.
              </p>
              <Link
                to="/platform/login"
                className="inline-flex items-center text-xs font-semibold text-primary hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Admin Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5 text-center">
                <h2 className="text-base font-bold text-text-primary">Forgot Password</h2>
                <p className="text-xs text-text-muted mt-1">
                  Enter your administrative email to receive a recovery link
                </p>
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
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm font-semibold shadow-md flex items-center justify-center gap-2 mt-4"
                  isLoading={loading}
                >
                  <span>Send Recovery Link</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/platform/login"
                    className="inline-flex items-center text-xs font-semibold text-text-muted hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Admin Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </Card>
      </main>

      {/* Footer Legal & Version */}
      <footer className="w-full max-w-md py-4 flex flex-col items-center space-y-3 text-xs safe-bottom" style={{ color: 'var(--text-muted)' }}>
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

export default PlatformForgotPasswordPage;
