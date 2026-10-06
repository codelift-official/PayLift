import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../../api/auth';
import { useAuthStore, type Role } from '../../stores/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getApiErrorMessage } from '../../lib/errors';

const setupSchema = z
  .object({
    name: z.string().min(2, 'Business name must be at least 2 characters'),
    slug: z
      .string()
      .min(3, 'Slug must be at least 3 characters')
      .max(50, 'Slug max 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
    gst: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
        'Invalid GSTIN format (15 characters)'
      ),
    ownerName: z.string().min(2, 'Owner name required'),
    ownerEmail: z.string().email('Valid owner email required'),
    ownerMobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile number required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm password required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetupValues = z.infer<typeof setupSchema>;

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setTokens, setUser, setTenantSlug } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      slug: '',
      gst: '',
      ownerName: '',
      ownerEmail: '',
      ownerMobile: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Auto-generate slug from name if not manually modified
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val);
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    setValue('slug', generatedSlug, { shouldValidate: true });
  };

  const onSubmit = async (data: SetupValues) => {
    setLoading(true);
    try {
      await authApi.setupBusiness({
        name: data.name,
        slug: data.slug,
        gst: data.gst || null,
        ownerEmail: data.ownerEmail,
        ownerMobile: data.ownerMobile,
        ownerPassword: data.password,
      });

      toast.success('Business created! Logging you in...');

      // Auto-login
      const loginRes = await authApi.login({
        tenant: data.slug,
        email: data.ownerEmail,
        password: data.password,
      });

      setTenantSlug(data.slug);
      setTokens(loginRes.accessToken, loginRes.refreshToken);
      setUser({
        userID: loginRes.userID,
        tenantID: loginRes.tenantID,
        role: (loginRes.role as Role) || 'BusinessAdmin',
        email: data.ownerEmail,
        name: data.ownerName,
        mobile: data.ownerMobile,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col justify-center items-center p-4 py-8">
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/25">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create Your Business</h1>
        <p className="text-xs text-text-muted mt-1">Setup your Sahayak store in under 1 minute</p>
      </div>

      <Card className="w-full max-w-[520px] shadow-raised bg-card border-border">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              placeholder="Sharma Cloth Emporium"
              {...register('name')}
              onChange={handleNameChange}
              error={errors.name?.message}
            />

            <Input
              label="Shop Slug"
              placeholder="sharma-cloth"
              {...register('slug')}
              error={errors.slug?.message}
              hint="Unique ID used for login URL"
            />
          </div>

          <Input
            label="GSTIN (Optional)"
            placeholder="07AAAAA0000A1Z5"
            {...register('gst')}
            error={errors.gst?.message}
            autoCapitalize="characters"
          />

          <div className="border-t border-border pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
              Owner Credentials
            </h3>
            <div className="space-y-4">
              <Input
                label="Owner Full Name"
                placeholder="Ramesh Sharma"
                {...register('ownerName')}
                error={errors.ownerName?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Owner Email"
                  type="email"
                  placeholder="ramesh@gmail.com"
                  {...register('ownerEmail')}
                  error={errors.ownerEmail?.message}
                />

                <Input
                  label="Owner Mobile"
                  placeholder="9876543210"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('ownerMobile')}
                  error={errors.ownerMobile?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5 mt-4" isLoading={loading}>
            Complete Setup & Start Billing
          </Button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs font-semibold text-text-muted hover:text-text-primary">
              Already have an account? <span className="text-primary font-bold">Login</span>
            </Link>
          </div>
        </form>
      </Card>

      {/* Footer Legal */}
      <div className="mt-6 text-center text-xs space-x-3" style={{ color: 'var(--text-muted)' }}>
        <Link to="/terms" className="hover:underline">Terms</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
      </div>
    </div>
  );
};
