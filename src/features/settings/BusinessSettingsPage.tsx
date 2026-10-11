import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Package, Percent, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';

export const BusinessSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({
    InventoryModeEnabled: 'false',
    StrictStockMode: 'false',
    AllowCouponStacking: 'false',
    StrictBillingMode: 'false',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['business', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get('/business/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (data && typeof data === 'object') {
      setFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Record<string, string>) => {
      for (const [key, value] of Object.entries(updatedSettings)) {
        await apiClient.put('/business/settings', { key, value });
      }
      return updatedSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['business', 'settings'], updated);
      toast.success('Business settings saved successfully');
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save business settings';
      setFormError(msg);
      toast.error(msg);
    },
  });

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
    saveMutation.mutate(formData);
  };

  const isInventoryOn = formData.InventoryModeEnabled?.toLowerCase() === 'true';
  const isStrictStockOn = formData.StrictStockMode?.toLowerCase() === 'true';
  const isCouponStackingOn = formData.AllowCouponStacking?.toLowerCase() === 'true';
  const isStrictBillingOn = formData.StrictBillingMode?.toLowerCase() === 'true';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 sm:pb-8" id="business-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Business Settings"
          subtitle="Enterprise parameters and inventory enforcement policies"
        />

        <div className="hidden sm:block">
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            id="btn-save-business-settings-desktop"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Business Settings
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-3 text-xs rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
          {formError}
        </div>
      )}

      {isLoading ? (
        <div className="p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category: Inventory & Stock */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Package className="w-4 h-4" /> Inventory & Stock Enforcement
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="toggle-inventory-mode" className="text-sm font-semibold cursor-pointer">
                    Inventory Mode Enabled
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Track stock counts and manage product catalogs.
                  </p>
                </div>
                <button
                  id="toggle-inventory-mode"
                  type="button"
                  role="switch"
                  aria-checked={isInventoryOn}
                  onClick={() => handleToggle('InventoryModeEnabled')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isInventoryOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isInventoryOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-strict-stock" className="text-sm font-semibold cursor-pointer">
                    Strict Stock Mode
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Block checkout when product stock reaches zero.
                  </p>
                </div>
                <button
                  id="toggle-strict-stock"
                  type="button"
                  role="switch"
                  aria-checked={isStrictStockOn}
                  onClick={() => handleToggle('StrictStockMode')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isStrictStockOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isStrictStockOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Category: Billing & Policies */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Percent className="w-4 h-4" /> Billing & Discount Policies
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <label htmlFor="toggle-allow-coupon-stacking" className="text-sm font-semibold cursor-pointer">
                    Allow Coupon Stacking
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Allow combining multiple promo codes per bill.
                  </p>
                </div>
                <button
                  id="toggle-allow-coupon-stacking"
                  type="button"
                  role="switch"
                  aria-checked={isCouponStackingOn}
                  onClick={() => handleToggle('AllowCouponStacking')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isCouponStackingOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isCouponStackingOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-strict-billing" className="text-sm font-semibold cursor-pointer">
                    Strict Billing Mode
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Require manager approval for manual line discounts.
                  </p>
                </div>
                <button
                  id="toggle-strict-billing"
                  type="button"
                  role="switch"
                  aria-checked={isStrictBillingOn}
                  onClick={() => handleToggle('StrictBillingMode')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isStrictBillingOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isStrictBillingOn ? 'translate-x-5' : 'translate-x-0'
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
              id="btn-save-business-settings-mobile"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Business Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
