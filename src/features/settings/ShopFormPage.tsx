import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { shopsApi } from '../../api/shops';
import { CreateShopRequest, UpdateShopRequest } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getApiErrorMessage } from '../../lib/errors';
import { apiClient } from '../../api/client';
import {
  Store,
  MapPin,
  Receipt,
  Bell,
  Printer,
  Globe,
  Loader2,
  Percent,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';

// ─── Validation schema ────────────────────────────────────────────
const shopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  address: z.string().min(5, 'Please enter a full address'),
  mobile: z.string().regex(/^\+?[\d\s\-()]{7,15}$/, 'Enter a valid phone number'),
  gst: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val.trim().toUpperCase()),
      'Invalid GSTIN format (must be 15 alphanumeric characters, e.g. 27AABCU9603R1ZM)'
    ),
  gstEnabled: z.boolean().default(true),
  gstRate: z.coerce.number().min(0).max(100).default(18),
  gstInclusive: z.boolean().default(true),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  exchangePolicyDays: z.coerce.number().int().min(0).max(365).optional(),
  receiptFooter: z.string().max(200, 'Max 200 characters').optional().or(z.literal('')),
  printerType: z.string().optional().or(z.literal('')),
  printerName: z.string().optional().or(z.literal('')),
  whatsAppEnabled: z.boolean().optional(),
  notificationEmail: z.string().email('Must be a valid email').optional().or(z.literal('')),
  notificationSms: z.boolean().optional(),
  customerRecommendEnabled: z.boolean().default(true),
  customerMandatory: z.boolean().default(false),
  discountMode: z.enum(['Percentage', 'Amount']).default('Percentage'),
  productSource: z.enum(['Store', 'Generic', 'Mix']).default('Store'),
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
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; id: string; label: string; description?: string; disabled?: boolean }> = ({
  checked, onChange, id, label, description, disabled,
}) => (
  <div className={`flex items-center justify-between py-1 ${disabled ? 'opacity-50' : ''}`}>
    <div>
      <label htmlFor={id} className={`text-sm font-semibold ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} style={{ color: 'var(--text-primary)' }}>
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
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
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
      gstEnabled: true,
      gstRate: 18,
      gstInclusive: true,
      logoUrl: '',
      exchangePolicyDays: 7,
      receiptFooter: '',
      printerType: '',
      printerName: '',
      whatsAppEnabled: false,
      notificationEmail: '',
      notificationSms: false,
      customerRecommendEnabled: true,
      customerMandatory: false,
      discountMode: 'Percentage',
      productSource: 'Store',
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
        gstEnabled: existingShop.gstEnabled ?? (Boolean(existingShop.gst)),
        gstRate: existingShop.gstRate ?? 18,
        gstInclusive: existingShop.gstInclusive ?? true,
        logoUrl: existingShop.logoUrl ?? '',
        exchangePolicyDays: existingShop.exchangePolicyDays ?? 7,
        receiptFooter: existingShop.receiptFooter ?? '',
        printerType: existingShop.printerType ?? '',
        printerName: existingShop.printerName ?? '',
        whatsAppEnabled: existingShop.whatsAppEnabled ?? false,
        notificationEmail: existingShop.notificationEmail ?? '',
        notificationSms: existingShop.notificationSms ?? false,
        customerRecommendEnabled: existingShop.customerRecommendEnabled ?? true,
        customerMandatory: existingShop.customerMandatory ?? false,
        discountMode: (existingShop.discountMode as 'Percentage' | 'Amount') ?? 'Percentage',
        productSource: (existingShop.productSource as 'Store' | 'Generic' | 'Mix') ?? 'Store',
      });
    }
  }, [existingShop, reset]);

  const gstEnabled = watch('gstEnabled');
  const gstInclusive = watch('gstInclusive');
  const whatsAppEnabled = watch('whatsAppEnabled');
  const notificationSms = watch('notificationSms');
  const customerRecommendEnabled = watch('customerRecommendEnabled');
  const customerMandatory = watch('customerMandatory');
  const discountMode = watch('discountMode');
  const productSource = watch('productSource');

  const [criticalErrors, setCriticalErrors] = useState<string[]>([]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ShopFormValues) => {
      const payload: CreateShopRequest = {
        name: data.name,
        address: data.address,
        mobile: data.mobile,
        gst: data.gstEnabled ? (data.gst?.trim().toUpperCase() || null) : null,
        gstEnabled: data.gstEnabled,
        gstRate: data.gstEnabled ? Number(data.gstRate || 0) : 0,
        gstInclusive: data.gstInclusive,
        logoUrl: data.logoUrl || null,
        exchangePolicyDays: data.exchangePolicyDays ?? null,
        receiptFooter: data.receiptFooter || null,
        printerType: data.printerType || null,
        printerName: data.printerName || null,
        whatsAppEnabled: data.whatsAppEnabled ?? false,
        notificationEmail: data.notificationEmail || null,
        notificationSms: data.notificationSms ?? false,
      };
      const created = await shopsApi.createShop(payload);
      if (created?.id) {
        try {
          await apiClient.put(`/shops/${created.id}/settings`, { key: 'DefaultGstRate', value: String(payload.gstRate ?? 18) });
          await apiClient.put(`/shops/${created.id}/settings`, { key: 'PricesIncludeGst', value: String(payload.gstInclusive ?? true) });
          await apiClient.put(`/shops/${created.id}/settings`, { key: 'ShopGstin', value: payload.gst || '' });
          await apiClient.put(`/shops/${created.id}/settings`, { key: 'GstEnabled', value: String(payload.gstEnabled ?? true) });
        } catch {
          // silent sync
        }
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop created successfully!');
      navigate('/settings/shops');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      setCriticalErrors([msg]);
      toast.error(msg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ShopFormValues) => {
      const payload: UpdateShopRequest = {
        name: data.name,
        address: data.address,
        mobile: data.mobile,
        gst: data.gstEnabled ? (data.gst?.trim().toUpperCase() || null) : null,
        gstEnabled: data.gstEnabled,
        gstRate: data.gstEnabled ? Number(data.gstRate || 0) : 0,
        gstInclusive: data.gstInclusive,
        logoUrl: data.logoUrl || null,
        exchangePolicyDays: data.exchangePolicyDays ?? null,
        receiptFooter: data.receiptFooter || null,
        printerType: data.printerType || null,
        printerName: data.printerName || null,
        whatsAppEnabled: data.whatsAppEnabled ?? false,
        notificationEmail: data.notificationEmail || null,
        notificationSms: data.notificationSms ?? false,
      };
      const res = await shopsApi.updateShop(id!, payload);
      // Also sync tax and bill journey settings
      await shopsApi.updateShopTaxSettings(id!, {
        gst: payload.gst,
        gstEnabled: payload.gstEnabled,
        gstRate: payload.gstRate,
        gstInclusive: payload.gstInclusive,
        customerRecommendEnabled: data.customerRecommendEnabled,
        customerMandatory: data.customerMandatory,
        discountMode: data.discountMode,
        productSource: data.productSource,
      });

      // Also sync key-value settings for unified consistency
      try {
        await apiClient.put(`/shops/${id}/settings`, { key: 'DefaultGstRate', value: String(payload.gstRate ?? 18) });
        await apiClient.put(`/shops/${id}/settings`, { key: 'PricesIncludeGst', value: String(payload.gstInclusive ?? true) });
        await apiClient.put(`/shops/${id}/settings`, { key: 'ShopGstin', value: payload.gst || '' });
        await apiClient.put(`/shops/${id}/settings`, { key: 'GstEnabled', value: String(payload.gstEnabled ?? true) });
      } catch {
        // silent sync
      }

      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      queryClient.invalidateQueries({ queryKey: ['shop', id, 'settings'] });
      toast.success('Shop updated successfully!');
      navigate('/settings/shops');
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      setCriticalErrors([msg]);
      toast.error(msg);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onInvalid = (formErrors: any) => {
    const errList = Object.entries(formErrors).map(([field, err]: any) => {
      const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
      return `${fieldName}: ${err?.message || 'Invalid value'}`;
    });
    setCriticalErrors(errList);
    toast.error(`Critical validation error: ${errList[0] || 'Please fix the errors below'}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: ShopFormValues) => {
    setCriticalErrors([]);
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
            onClick={handleSubmit(onSubmit, onInvalid)}
            isLoading={isPending}
            className="hidden sm:inline-flex"
            id="btn-save-shop-form-desktop"
          >
            {isEdit ? 'Save Changes' : 'Create Shop'}
          </Button>
        }
      />

      {/* Critical Validation Error Banner */}
      {criticalErrors.length > 0 && (
        <div
          className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 space-y-2 shadow-sm"
          id="critical-validation-banner"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Critical Store Settings Errors</span>
          </div>
          <p className="text-xs">The store settings cannot be saved until the following issues are resolved:</p>
          <ul className="list-disc list-inside text-xs space-y-1 font-medium pl-1">
            {criticalErrors.map((msg: string, idx: number) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
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
            <Input
              label="Contact Phone"
              placeholder="9876543210"
              type="tel"
              {...register('mobile')}
              error={errors.mobile?.message}
            />
          </FieldGroup>
        </Card>

        {/* ── GST & Tax Settings ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<Percent className="w-3.5 h-3.5" />} label="GST & Tax Settings" />
          <FieldGroup>
            <Toggle
              id="gst-enabled-toggle"
              label="Enable GST for this Shop"
              description="Calculate tax on sales and include GST breakup on invoices"
              checked={!!gstEnabled}
              onChange={(v) => setValue('gstEnabled', v, { shouldDirty: true })}
            />

            {gstEnabled && (
              <div className="space-y-4 pt-2 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Shop GSTIN (15 Digits)"
                    placeholder="27AABCU9603R1ZM"
                    maxLength={15}
                    {...register('gst', {
                      onChange: (e) => {
                        e.target.value = e.target.value.toUpperCase();
                      },
                    })}
                    error={errors.gst?.message}
                  />

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Default GST Rate
                    </label>
                    <select
                      {...register('gstRate', { valueAsNumber: true })}
                      className="w-full text-sm border border-border rounded-input px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                    >
                      <option value={0}>0% - Tax Exempt / Nil Rated</option>
                      <option value={5}>5% - Food & Essentials</option>
                      <option value={12}>12% - Standard Lower (Apparel/Packaged)</option>
                      <option value={18}>18% - Standard Retail & FMCG (Recommended)</option>
                      <option value={28}>28% - Higher Rate</option>
                    </select>
                  </div>
                </div>

                <Toggle
                  id="gst-inclusive-toggle"
                  label="Prices are inclusive of GST"
                  description="Item prices entered during checkout already include GST (Retail standard)"
                  checked={!!gstInclusive}
                  onChange={(v) => setValue('gstInclusive', v, { shouldDirty: true })}
                />
              </div>
            )}
          </FieldGroup>
        </Card>

        {/* ── Bill Creation Settings ── */}
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <SectionHeader icon={<ShoppingCart className="w-3.5 h-3.5" />} label="Bill Creation Settings" />
          <FieldGroup>
            <Toggle
              id="customer-recommend-toggle"
              label="Recommend matching customers while typing"
              description="Suggest existing customers based on name or mobile number (min 2 chars)"
              checked={!!customerRecommendEnabled}
              onChange={(v) => {
                setValue('customerRecommendEnabled', v, { shouldDirty: true });
                if (!v) {
                  setValue('customerMandatory', false, { shouldDirty: true });
                }
              }}
            />

            <Toggle
              id="customer-mandatory-toggle"
              label="Require customer on every bill"
              description={
                customerRecommendEnabled
                  ? "Cashier cannot generate bill without selecting or creating a customer"
                  : "Requires customer recommendation to be enabled"
              }
              checked={!!customerMandatory}
              disabled={!customerRecommendEnabled}
              onChange={(v) => setValue('customerMandatory', v, { shouldDirty: true })}
            />

            <div className="pt-2 border-t border-border/50">
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Discount Input Default
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setValue('discountMode', 'Percentage', { shouldDirty: true })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-semibold transition-all ${
                    discountMode === 'Percentage'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>Percentage (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue('discountMode', 'Amount', { shouldDirty: true })}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-semibold transition-all ${
                    discountMode === 'Amount'
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <span>Fixed Amount (₹)</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50">
              <label className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Product Search Source
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md">
                {[
                  { value: 'Store', label: 'Store Only' },
                  { value: 'Generic', label: 'Generic Catalog' },
                  { value: 'Mix', label: 'Both (Store First)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('productSource', opt.value as 'Store' | 'Generic' | 'Mix', { shouldDirty: true })}
                    className={`flex items-center justify-center py-2 px-2 text-xs sm:text-sm rounded-lg border font-semibold transition-all text-center ${
                      productSource === opt.value
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
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
