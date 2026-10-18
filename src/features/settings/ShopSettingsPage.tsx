import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Store, Printer, Bell, Percent, Save, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { shopsApi } from '../../api/shops';
import { useAuthStore } from '../../stores/auth.store';

export const ShopSettingsPage: React.FC = () => {
  const params = useParams();
  const defaultShopId = useAuthStore((s) => s.user?.defaultShopID);

  const queryClient = useQueryClient();

  // Load shops list to bind store ID and allow multi-branch selector
  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (shops && shops.length > 0) {
      if (!selectedShopId) {
        const candidateId = params.shopID || params.id || defaultShopId;
        const matched = candidateId ? shops.find((s) => s.id === candidateId) : null;
        setSelectedShopId(matched ? matched.id : shops[0].id);
      }
    }
  }, [shops, params.shopID, params.id, defaultShopId, selectedShopId]);

  const activeShop = shops?.find((s) => s.id === selectedShopId) || shops?.[0];
  const effectiveShopId = selectedShopId || activeShop?.id || params.shopID || params.id || defaultShopId || 's1';

  const [formData, setFormData] = useState<Record<string, string>>({
    ShopGstin: '',
    GstEnabled: 'true',
    DefaultGstRate: '18',
    PricesIncludeGst: 'true',
    RoundingMode: 'round',
    DiscountMode: 'both',
    ProductSource: 'both',
    CouponStackingEnabled: 'false',
    CustomerRecommendEnabled: 'true',
    CustomerMandatory: 'false',
    ExchangePolicyDays: '14',
    ReceiptFooter: 'Thank you for shopping with us!',
    PrinterType: 'Thermal',
    PrinterName: '',
    WhatsAppEnabled: 'false',
    NotificationEmail: '',
    NotificationSms: 'false',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Sync state when activeShop changes
  useEffect(() => {
    if (activeShop) {
      setFormData((prev) => ({
        ...prev,
        ShopGstin: activeShop.gst || prev.ShopGstin || '',
        GstEnabled: String(activeShop.gstEnabled ?? true),
        DefaultGstRate: String(activeShop.gstRate ?? prev.DefaultGstRate ?? '18'),
        PricesIncludeGst: String(activeShop.gstInclusive ?? prev.PricesIncludeGst ?? 'true'),
        CustomerMandatory: String(activeShop.customerMandatory ?? prev.CustomerMandatory ?? 'false'),
        CustomerRecommendEnabled: String(activeShop.customerRecommendEnabled ?? prev.CustomerRecommendEnabled ?? 'true'),
        DiscountMode: activeShop.discountMode === 'Amount' ? 'bill' : prev.DiscountMode || 'both',
        ProductSource: activeShop.productSource === 'Store' ? 'catalog' : activeShop.productSource === 'Generic' ? 'manual' : prev.ProductSource || 'both',
        ExchangePolicyDays: String(activeShop.exchangePolicyDays ?? prev.ExchangePolicyDays ?? '14'),
        ReceiptFooter: activeShop.receiptFooter ?? prev.ReceiptFooter ?? 'Thank you for shopping with us!',
        PrinterType: activeShop.printerType ?? prev.PrinterType ?? 'Thermal',
        PrinterName: activeShop.printerName ?? prev.PrinterName ?? '',
        WhatsAppEnabled: String(activeShop.whatsAppEnabled ?? prev.WhatsAppEnabled ?? 'false'),
        NotificationEmail: activeShop.notificationEmail ?? prev.NotificationEmail ?? '',
        NotificationSms: String(activeShop.notificationSms ?? prev.NotificationSms ?? 'false'),
      }));
    }
  }, [activeShop]);

  // Load key-value settings from API
  const { data: kvSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['shop', effectiveShopId, 'settings'],
    queryFn: async () => {
      const res = await apiClient.get(`/shops/${effectiveShopId}/settings`);
      return res.data;
    },
    enabled: !!effectiveShopId,
  });

  useEffect(() => {
    if (kvSettings && typeof kvSettings === 'object') {
      setFormData((prev) => ({
        ...prev,
        ...kvSettings,
      }));
    }
  }, [kvSettings]);

  // Validation function
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // 1. GSTIN Validation
    const isGstOn = formData.GstEnabled !== 'false';
    const gstin = formData.ShopGstin?.trim().toUpperCase() || '';
    if (isGstOn && gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstin)) {
        errors.ShopGstin = 'Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 27AABCU9603R1ZM).';
      }
    }

    // 2. Default GST Rate Validation
    const gstRate = Number(formData.DefaultGstRate);
    if (formData.DefaultGstRate === '' || isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
      errors.DefaultGstRate = 'Default GST Rate must be a valid percentage between 0% and 100%.';
    }

    // 3. Exchange Policy Days Validation
    const days = Number(formData.ExchangePolicyDays);
    if (formData.ExchangePolicyDays === '' || isNaN(days) || days < 0 || days > 365) {
      errors.ExchangePolicyDays = 'Exchange policy window must be a number between 0 and 365 days.';
    }

    // 4. Notification Email Validation
    const email = formData.NotificationEmail?.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.NotificationEmail = 'Daily report email must be a valid email address (e.g. name@shop.com).';
      }
    }

    return errors;
  };

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Record<string, string>) => {
      const isGstOn = updatedSettings.GstEnabled !== 'false';
      const cleanGstin = updatedSettings.ShopGstin?.trim().toUpperCase() || null;
      const gstRateNum = Number(updatedSettings.DefaultGstRate || 18);
      const isPricesInc = updatedSettings.PricesIncludeGst?.toLowerCase() === 'true';

      const targetId = activeShop?.id || effectiveShopId;

      // 1. Update the actual Shop Entity
      if (targetId) {
        await shopsApi.updateShop(targetId, {
          name: activeShop?.name || 'Main Shop',
          address: activeShop?.address || 'Main Address',
          mobile: activeShop?.mobile || '9999999999',
          gst: cleanGstin,
          gstEnabled: isGstOn,
          gstRate: isGstOn ? gstRateNum : 0,
          gstInclusive: isPricesInc,
          exchangePolicyDays: Number(updatedSettings.ExchangePolicyDays || 14),
          receiptFooter: updatedSettings.ReceiptFooter || null,
          printerType: updatedSettings.PrinterType || null,
          printerName: updatedSettings.PrinterName || null,
          whatsAppEnabled: updatedSettings.WhatsAppEnabled?.toLowerCase() === 'true',
          notificationEmail: updatedSettings.NotificationEmail || null,
          notificationSms: updatedSettings.NotificationSms?.toLowerCase() === 'true',
        });

        await shopsApi.updateShopTaxSettings(targetId, {
          gst: cleanGstin,
          gstEnabled: isGstOn,
          gstRate: isGstOn ? gstRateNum : 0,
          gstInclusive: isPricesInc,
          customerRecommendEnabled: updatedSettings.CustomerRecommendEnabled?.toLowerCase() === 'true',
          customerMandatory: updatedSettings.CustomerMandatory?.toLowerCase() === 'true',
          discountMode: updatedSettings.DiscountMode === 'item' ? 'Percentage' : 'Amount',
          productSource:
            updatedSettings.ProductSource === 'catalog'
              ? 'Store'
              : updatedSettings.ProductSource === 'manual'
              ? 'Generic'
              : 'Mix',
        });
      }

      // 2. Also save to key-value settings endpoint for backward compatibility
      for (const [key, value] of Object.entries(updatedSettings)) {
        await apiClient.put(`/shops/${effectiveShopId}/settings`, { key, value });
      }

      return updatedSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['shop', effectiveShopId, 'settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop settings saved successfully');
      setFormError(null);
      setValidationErrors({});
    },
    onError: (err: any) => {
      const msg =
        err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save shop settings';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleToggle = (key: string) => {
    setFormData((prev) => {
      const current = prev[key]?.toLowerCase() === 'true';
      return {
        ...prev,
        [key]: current ? 'false' : 'true',
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(`Critical validation error: ${firstError}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors({});
    saveMutation.mutate(formData);
  };

  const isCustomerMandatory = formData.CustomerMandatory?.toLowerCase() === 'true';
  const isCustomerRecommend = formData.CustomerRecommendEnabled?.toLowerCase() === 'true';
  const isCouponStacking = formData.CouponStackingEnabled?.toLowerCase() === 'true';
  const isGstEnabled = formData.GstEnabled?.toLowerCase() !== 'false';
  const isPricesIncludeGst = formData.PricesIncludeGst?.toLowerCase() === 'true';
  const isWhatsAppOn = formData.WhatsAppEnabled?.toLowerCase() === 'true';
  const isNotificationSmsOn = formData.NotificationSms?.toLowerCase() === 'true';

  const isLoading = shopsLoading || settingsLoading;
  const hasCriticalErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-8" id="shop-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <PageHeader
            title="Shop Settings"
            subtitle="Branch-level POS policies, printer configuration, and tax preferences"
          />
          {activeShop && (
            <p className="text-xs font-semibold text-primary mt-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Editing Settings for: {activeShop.name} ({activeShop.address || 'Main Branch'})
            </p>
          )}
        </div>

        <div className="hidden sm:block">
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            id="btn-save-shop-settings-desktop"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Shop Settings
          </Button>
        </div>
      </div>

      {/* Store Branch Selector if multi-store */}
      {shops && shops.length > 1 && (
        <Card className="p-4 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Store Branch</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Select location to configure</p>
            </div>
          </div>
          <select
            value={effectiveShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="text-sm border border-border rounded-input px-3 py-2 font-medium focus:ring-1 focus:ring-primary focus:outline-none"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            id="select-shop-branch"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.address ? `— ${s.address}` : ''}
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Critical Validation Error Banner */}
      {hasCriticalErrors && (
        <div
          className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 space-y-2 shadow-sm"
          id="critical-validation-banner"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Critical Store Settings Errors</span>
          </div>
          <p className="text-xs">The settings cannot be saved until the following issues are resolved:</p>
          <ul className="list-disc list-inside text-xs space-y-1 font-medium pl-1">
            {Object.entries(validationErrors).map(([key, msg]) => (
              <li key={key}>
                <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {formError && (
        <div className="p-3 text-xs rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category 1: Checkout & Customer Policies */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Store className="w-4 h-4" /> Checkout & Customer Policies
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="toggle-customer-mandatory" className="text-sm font-semibold cursor-pointer">
                    Customer Mandatory
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Require customer phone number for every bill.
                  </p>
                </div>
                <button
                  id="toggle-customer-mandatory"
                  type="button"
                  role="switch"
                  aria-checked={isCustomerMandatory}
                  onClick={() => handleToggle('CustomerMandatory')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCustomerMandatory ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isCustomerMandatory ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-customer-recommend" className="text-sm font-semibold cursor-pointer">
                    Customer Recommendations
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Suggest customer profiles as phone digits are typed.
                  </p>
                </div>
                <button
                  id="toggle-customer-recommend"
                  type="button"
                  role="switch"
                  aria-checked={isCustomerRecommend}
                  onClick={() => handleToggle('CustomerRecommendEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCustomerRecommend ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isCustomerRecommend ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-coupon-stacking" className="text-sm font-semibold cursor-pointer">
                    Coupon Stacking Enabled
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Allow combining multiple offers on a single checkout.
                  </p>
                </div>
                <button
                  id="toggle-coupon-stacking"
                  type="button"
                  role="switch"
                  aria-checked={isCouponStacking}
                  onClick={() => handleToggle('CouponStackingEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCouponStacking ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isCouponStacking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Category 2: Taxes & Pricing Rules (Unified GST Settings) */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
            id="card-tax-gst-settings"
          >
            <div className="border-b pb-3 flex items-center justify-between" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Percent className="w-4 h-4" /> Taxes & GST Configuration
              </h2>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                Unified Store Tax Engine
              </span>
            </div>

            {/* GST Master Toggle */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <div className="space-y-0.5">
                <label htmlFor="toggle-gst-enabled" className="text-sm font-semibold cursor-pointer">
                  Calculate GST on Sales
                </label>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Enable Goods and Services Tax computation, CGST/SGST breakup, and invoice compliance.
                </p>
              </div>
              <button
                id="toggle-gst-enabled"
                type="button"
                role="switch"
                aria-checked={isGstEnabled}
                onClick={() => handleToggle('GstEnabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isGstEnabled ? 'bg-success' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isGstEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* GSTIN & Rate Fields */}
            {isGstEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Shop GSTIN */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" htmlFor="input-shop-gstin">
                      Shop GSTIN (15 Digits)
                    </label>
                    <input
                      id="input-shop-gstin"
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 27AABCU9603R1ZM"
                      value={formData.ShopGstin || ''}
                      onChange={(e) => handleInputChange('ShopGstin', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 text-sm font-mono uppercase rounded-md border focus:ring-2 focus:outline-none ${
                        validationErrors.ShopGstin
                          ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                          : 'focus:ring-primary'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: validationErrors.ShopGstin ? undefined : 'var(--bg-border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {validationErrors.ShopGstin ? (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium" id="input-shop-gstin-error">
                        {validationErrors.ShopGstin}
                      </p>
                    ) : (
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        Official GST identification number printed on customer receipts.
                      </p>
                    )}
                  </div>

                  {/* Default GST Rate */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" htmlFor="input-default-gst">
                      Default GST Rate (%)
                    </label>
                    <div className="flex gap-2 mb-1.5">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleInputChange('DefaultGstRate', String(rate))}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                            formData.DefaultGstRate === String(rate)
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'border-border text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                    <input
                      id="input-default-gst"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.DefaultGstRate || '18'}
                      onChange={(e) => handleInputChange('DefaultGstRate', e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:outline-none ${
                        validationErrors.DefaultGstRate
                          ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                          : 'focus:ring-primary'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: validationErrors.DefaultGstRate ? undefined : 'var(--bg-border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    {validationErrors.DefaultGstRate ? (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium" id="input-default-gst-error">
                        {validationErrors.DefaultGstRate}
                      </p>
                    ) : (
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                        Standard tax percentage applied on general items without category override.
                      </p>
                    )}
                  </div>
                </div>

                {/* Prices Include GST Toggle */}
                <div className="pt-3 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                  <div className="space-y-0.5">
                    <label htmlFor="toggle-prices-include-gst" className="text-sm font-semibold cursor-pointer">
                      Prices Include GST (Retail Standard)
                    </label>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Product shelf prices entered during billing already contain the tax component.
                    </p>
                  </div>
                  <button
                    id="toggle-prices-include-gst"
                    type="button"
                    role="switch"
                    aria-checked={isPricesIncludeGst}
                    onClick={() => handleToggle('PricesIncludeGst')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPricesIncludeGst ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isPricesIncludeGst ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Pricing & POS Algorithm Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--bg-border)' }}>
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="select-rounding-mode">
                  Rounding Mode
                </label>
                <select
                  id="select-rounding-mode"
                  value={formData.RoundingMode || 'round'}
                  onChange={(e) => handleInputChange('RoundingMode', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="none">None (Exact cents)</option>
                  <option value="round">Standard Round (Half up)</option>
                  <option value="floor">Floor (Round down)</option>
                  <option value="ceil">Ceil (Round up)</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Rounding algorithm for bill net payable.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="select-discount-mode">
                  Discount Mode
                </label>
                <select
                  id="select-discount-mode"
                  value={formData.DiscountMode || 'both'}
                  onChange={(e) => handleInputChange('DiscountMode', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="both">Both item & bill discounts</option>
                  <option value="item">Line-item discounts only</option>
                  <option value="bill">Overall bill discount only</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Permitted discount levels during POS checkout.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="select-product-source">
                  Product Source
                </label>
                <select
                  id="select-product-source"
                  value={formData.ProductSource || 'both'}
                  onChange={(e) => handleInputChange('ProductSource', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="both">Both catalog & custom items</option>
                  <option value="catalog">Store catalog items only</option>
                  <option value="manual">Custom / manual items only</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Product lookup and barcode source restrictions.
                </p>
              </div>
            </div>
          </Card>

          {/* Category 3: Receipt & Hardware Configuration */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Printer className="w-4 h-4" /> Receipt & Hardware Configuration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-exchange-days">
                  Exchange Policy Days
                </label>
                <input
                  id="input-exchange-days"
                  type="number"
                  min="0"
                  max="365"
                  value={formData.ExchangePolicyDays || '14'}
                  onChange={(e) => handleInputChange('ExchangePolicyDays', e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:outline-none ${
                    validationErrors.ExchangePolicyDays
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                      : 'focus:ring-primary'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: validationErrors.ExchangePolicyDays ? undefined : 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {validationErrors.ExchangePolicyDays ? (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium" id="input-exchange-days-error">
                    {validationErrors.ExchangePolicyDays}
                  </p>
                ) : (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Number of days returns or exchanges are accepted.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-printer-type">
                  Printer Type
                </label>
                <select
                  id="input-printer-type"
                  value={formData.PrinterType || 'Thermal'}
                  onChange={(e) => handleInputChange('PrinterType', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Thermal">Thermal 80mm / 58mm</option>
                  <option value="ESCPOS">ESC/POS Network</option>
                  <option value="A4">Standard A4 Inkjet/Laser</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Hardware specification of attached bill printer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-printer-name">
                  Printer Device Name
                </label>
                <input
                  id="input-printer-name"
                  type="text"
                  placeholder="e.g. POS-80-Series"
                  value={formData.PrinterName || ''}
                  onChange={(e) => handleInputChange('PrinterName', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Local device identifier or network IP address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-receipt-footer">
                  Receipt Footer Text
                </label>
                <input
                  id="input-receipt-footer"
                  type="text"
                  maxLength={120}
                  value={formData.ReceiptFooter || ''}
                  onChange={(e) => handleInputChange('ReceiptFooter', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Custom thank-you message printed on bill bottom.
                </p>
              </div>
            </div>
          </Card>

          {/* Category 4: Notifications & E-Receipts */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Notifications & E-Receipts
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-notification-email">
                  Daily Report Email
                </label>
                <input
                  id="input-notification-email"
                  type="email"
                  placeholder="manager@shop.com"
                  value={formData.NotificationEmail || ''}
                  onChange={(e) => handleInputChange('NotificationEmail', e.target.value)}
                  className={`w-full sm:w-1/2 px-3 py-2 text-sm rounded-md border focus:ring-2 focus:outline-none ${
                    validationErrors.NotificationEmail
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                      : 'focus:ring-primary'
                  }`}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: validationErrors.NotificationEmail ? undefined : 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                {validationErrors.NotificationEmail ? (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium" id="input-notification-email-error">
                    {validationErrors.NotificationEmail}
                  </p>
                ) : (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Email address receiving daily sales reports.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-whatsapp" className="text-sm font-semibold cursor-pointer">
                    WhatsApp E-Receipts
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Send digital bill receipts automatically via WhatsApp.
                  </p>
                </div>
                <button
                  id="toggle-whatsapp"
                  type="button"
                  role="switch"
                  aria-checked={isWhatsAppOn}
                  onClick={() => handleToggle('WhatsAppEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isWhatsAppOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isWhatsAppOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-sms" className="text-sm font-semibold cursor-pointer">
                    Notification SMS
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Send transaction alerts to customer via SMS.
                  </p>
                </div>
                <button
                  id="toggle-sms"
                  type="button"
                  role="switch"
                  aria-checked={isNotificationSmsOn}
                  onClick={() => handleToggle('NotificationSms')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isNotificationSmsOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isNotificationSmsOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Sticky Mobile Save Button */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t bg-[var(--bg-card)]/90 backdrop-blur-md z-30" style={{ borderColor: 'var(--bg-border)' }}>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={saveMutation.isPending}
              id="btn-save-shop-settings-mobile"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Shop Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShopSettingsPage;
