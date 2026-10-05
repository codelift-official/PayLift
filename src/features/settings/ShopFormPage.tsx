import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { shopsApi } from '../../api/shops';
import { CreateShopRequest } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getApiErrorMessage } from '../../lib/errors';
import {
  Store,
  MapPin,
  Receipt,
  Bell,
  Printer,
  Globe,
  Loader2,
} from 'lucide-react';

// ─── Validation schema ────────────────────────────────────────────
const shopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a full address'),
  mobile: z.string().regex(/^\+?[\d\s\-()]{7,15}$/, 'Enter a valid phone number'),
  gst: z.string().optional().or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  exchangePolicyDays: z.coerce.number().int().min(0).max(365).optional(),
  receiptFooter: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  printerType: z.string().optional().or(z.literal('')),
  printerName: z.string().optional().or(z.literal('')),
  whatsAppEnabled: z.boolean().optional(),
  notificationEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  notificationSms: z.boolean().optional(),
});

type ShopFormValues = z.infer<typeof shopSchema>;

// ─── Helper: Section Header ───────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div
    className="px-5 py-3 border-b border-border flex items-center gap-1.5"
    style={{ backgroundColor: 'var(--bg-app)' }}
  >
    <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      {label}
    </h3>
  </div>
);

// ─── Helper: Field wrapper ────────────────────────────────────────
const FieldGroup: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-5 space-y-4 ${className}`}>{children}</div>
);

// ─── Toggle switch ────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string; label: string; description?: string }> = ({
  checked, onChange, id, label, description,
}) => (
  <div className="flex items-center justify-between py-1">
    <div>
      <label htmlFor={id} className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
        {label}
      </label>
      {description && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
      )}
    </div>
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-success' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        aria-hidden
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────
export const ShopFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  // Load existing shop if editing
  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
    enabled: isEdit,
    staleTime: 60_000,
  });

  const existingShop = isEdit ? shops?.find((s) => s.id === id) : undefined;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      address: '',
      mobile: '',
      gst: '',
      logoUrl: '',
      exchangePolicyDays: 7,
      receiptFooter: '',
      printerType: '',
      printerName: '',
      whatsAppEnabled: false,
      notificationEmail: '',
      notificationSms: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingShop) {
      reset({
        name: existingShop.name,
        address: existingShop.address,
        mobile: existingShop.mobile,
        gst: existingShop.gst ?? '',
        logoUrl: existingShop.logoUrl ?? '',
        exchangePolicyDays: existingShop.exchangePolicyDays ?? 7,
        receiptFooter: existingShop.receiptFooter ?? '',
        printerType: existingShop.printerType ?? '',
        printerName: existingShop.printerName ?? '',
        whatsAppEnabled: existingShop.whatsAppEnabled ?? false,
        notificationEmail: existingShop.notificationEmail ?? '',
        notificationSms: existingShop.notificationSms ?? false,
      });
    }
  }, [existingShop, reset]);

  const whatsAppEnabled = watch('whatsAppEnabled');
  const notificationSms = watch('notificationSms');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ShopFormValues) => {
      const payload: CreateShopRequest = {
        name: data.name,
        address: data.address,
        mobile: data.mobile,
        gst: data.gst || null,
        logoUrl: data.logoUrl || null,
        exchangePolicyDays: data.exchangePolicyDays ?? null,
        receiptFooter: data.receiptFooter || null,
        printerType: data.printerType || null,
        printerName: data.printerName || null,
        whatsAppEnabled: data.whatsAppEnabled ?? false,
        notificationEmail: data.notificationEmail || null,
        notificationSms: data.notificationSms ?? false,
      };
      return shopsApi.createShop(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop created successfully!');
      navigate('/settings/shops');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: ShopFormValues) => {
      const payload = {
        name: data.name,
        address: data.address,
        mobile: data.mobile,
        gst: data.gst || null,
        logoUrl: data.logoUrl || null,
        exchangePolicyDays: data.exchangePolicyDays ?? null,
        receiptFooter: data.receiptFooter || null,
        printerType: data.printerType || null,
        printerName: data.printerName || null,
        whatsAppEnabled: data.whatsAppEnabled ?? false,
        notificationEmail: data.notificationEmail || null,
        notificationSms: data.notificationSms ?? false,
      };
      return shopsApi.updateShop(id!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop updated successfully!');
      navigate('/settings/shops');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: ShopFormValues) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  // Loading state when fetching shop for edit
  if (isEdit && shopsLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24 sm:pb-6">
      <PageHeader
        title={isEdit ? 'Edit Shop' : 'Create New Shop'}
        subtitle={isEdit ? `Updating ${existingShop?.name || 'shop'}` : 'Add a new store location'}
        showBack
        backTo="/settings/shops"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isPending}
            className="hidden sm:inline-flex"
          >
            {isEdit ? 'Save Changes' : 'Create Shop'}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Basic Info ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Store className="w-3.5 h-3.5" />} label="Basic Information" />
          <FieldGroup>
            <Input
              label="Shop / Outlet Name"
              placeholder="e.g. Main Street Store"
              {...register('name')}
              error={errors.name?.message}
            />
            <div>
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3.5 h-3.5" /> Street Address
              </label>
              <textarea
                rows={3}
                placeholder="Full address including street, city, PIN"
                {...register('address')}
                className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              {errors.address && (
                <p className="text-xs text-danger mt-1">{errors.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                placeholder="9876543210"
                type="tel"
                {...register('mobile')}
                error={errors.mobile?.message}
              />
              <Input
                label="GSTIN (optional)"
                placeholder="27AABCU9603R1ZM"
                {...register('gst')}
                error={errors.gst?.message}
              />
            </div>
          </FieldGroup>
        </Card>

        {/* ── Receipt Settings ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Receipt className="w-3.5 h-3.5" />} label="Receipt & Exchange Policy" />
          <FieldGroup>
            <Input
              label="Exchange Policy (days)"
              type="number"
              placeholder="7"
              {...register('exchangePolicyDays')}
              error={errors.exchangePolicyDays?.message}
            />
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
                Receipt Footer Note
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Thank you for shopping with us!"
                {...register('receiptFooter')}
                className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              {errors.receiptFooter && (
                <p className="text-xs text-danger mt-1">{errors.receiptFooter.message}</p>
              )}
            </div>
          </FieldGroup>
        </Card>

        {/* ── Printer ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Printer className="w-3.5 h-3.5" />} label="Printer Settings" />
          <FieldGroup>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Printer Type"
                placeholder="e.g. Thermal"
                {...register('printerType')}
                error={errors.printerType?.message}
              />
              <Input
                label="Printer Name / Model"
                placeholder="e.g. EPSON TM-T82"
                {...register('printerName')}
                error={errors.printerName?.message}
              />
            </div>
          </FieldGroup>
        </Card>

        {/* ── Notifications ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Bell className="w-3.5 h-3.5" />} label="Notifications" />
          <FieldGroup>
            <Toggle
              id="whatsapp-toggle"
              label="WhatsApp Receipts"
              description="Send receipts to customers via WhatsApp"
              checked={!!whatsAppEnabled}
              onChange={(v) => setValue('whatsAppEnabled', v, { shouldDirty: true })}
            />
            <Toggle
              id="sms-toggle"
              label="SMS Notifications"
              description="Send bill confirmation SMS"
              checked={!!notificationSms}
              onChange={(v) => setValue('notificationSms', v, { shouldDirty: true })}
            />
            <Input
              label="Notification Email"
              type="email"
              placeholder="reports@yourstore.com"
              {...register('notificationEmail')}
              error={errors.notificationEmail?.message}
            />
          </FieldGroup>
        </Card>

        {/* ── Logo URL ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Globe className="w-3.5 h-3.5" />} label="Branding" />
          <FieldGroup>
            <Input
              label="Logo URL (optional)"
              placeholder="https://example.com/logo.png"
              {...register('logoUrl')}
              error={errors.logoUrl?.message}
            />
          </FieldGroup>
        </Card>

        {/* Mobile submit button */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised safe-bottom" style={{ backgroundColor: 'var(--bg-card)' }}>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full py-3"
            isLoading={isPending}
          >
            {isEdit ? 'Save Changes' : 'Create Shop'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShopFormPage;
