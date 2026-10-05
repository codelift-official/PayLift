import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Layers, Check, Loader2, Info } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { phase11Api, CouponSettings } from '../../../api/phase11';

export const CouponSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [allowCouponStacking, setAllowCouponStacking] = useState(false);

  const { data, isLoading } = useQuery<CouponSettings>({
    queryKey: ['couponSettings'],
    queryFn: phase11Api.getCouponSettings,
  });

  useEffect(() => {
    if (data) {
      setAllowCouponStacking(data.allowCouponStacking);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: CouponSettings) => phase11Api.updateCouponSettings(settings),
    onSuccess: (updated) => {
      queryClient.setQueryData(['couponSettings'], updated);
      toast.success('Coupon settings saved');
    },
    onError: () => {
      toast.error('Failed to update coupon settings');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ allowCouponStacking });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/coupons"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to coupons"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Coupon Settings"
          subtitle="Configure multi-coupon redemption and stacking rules"
        />
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-border shadow-card p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
          {/* Coupon Stacking Toggle */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-1">
              <label htmlFor="coupon-stacking-toggle" className="text-sm font-bold text-text-primary flex items-center gap-2 cursor-pointer">
                <Layers className="w-4 h-4 text-primary" />
                Allow Coupon Stacking
              </label>
              <p className="text-xs text-text-muted max-w-md">
                When ON, multiple coupons can apply to one bill. Applied in order entered.
              </p>
            </div>
            <button
              id="toggle-coupon-stacking"
              data-testid="toggle-coupon-stacking"
              type="button"
              role="switch"
              aria-checked={allowCouponStacking}
              onClick={() => setAllowCouponStacking(!allowCouponStacking)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                allowCouponStacking ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  allowCouponStacking ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Stacking Order Rule</p>
              <p className="opacity-90">
                Coupons will reduce the eligible remaining balance sequentially. If stacking is turned OFF, cashiers can only apply one coupon per bill.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              id="save-coupon-settings-btn"
              onClick={handleSave}
              isLoading={saveMutation.isPending}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Settings
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
