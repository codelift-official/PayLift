import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Percent, Loader2, Check } from 'lucide-react';

export const TaxSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.[0];
  const shopId = activeShop?.id || '';

  const [gstEnabled, setGstEnabled] = useState(true);
  const [gstRate, setGstRate] = useState(18);
  const [gstInclusive, setGstInclusive] = useState(true);
  const [gst, setGst] = useState('');

  useEffect(() => {
    if (activeShop) {
      setGstEnabled(activeShop.gstEnabled ?? true);
      setGstRate(activeShop.gstRate ?? 18);
      setGstInclusive(activeShop.gstInclusive ?? true);
      setGst(activeShop.gst ?? '');
    }
  }, [activeShop]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!shopId) throw new Error('No active shop found');
      return shopsApi.updateShop(shopId, {
        name: activeShop?.name || 'Main Shop',
        address: activeShop?.address || 'Main Address',
        mobile: activeShop?.mobile || '9999999999',
        gst: gst.trim(),
        gstEnabled,
        gstRate: Number(gstRate),
        gstInclusive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Tax and GST settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save tax settings');
    },
  });

  const handleSave = () => {
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 sm:pb-8" id="tax-settings-container">
      <PageHeader
        title="Tax & GST Settings"
        subtitle="Configure GST rates, inclusivity in pricing, and shop tax identification"
      />

      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div
          className="px-5 py-3 border-b border-border flex items-center gap-1.5"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <Percent className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            GST Configuration
          </h3>
        </div>

        <div className="p-5 space-y-5">
          {/* GST Enabled Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <label htmlFor="tax-gst-enabled" className="text-sm font-semibold text-text-primary cursor-pointer">
                Enable GST Calculation
              </label>
              <p className="text-xs text-text-muted mt-0.5">
                Automatically calculate CGST and SGST on customer invoices
              </p>
            </div>
            <input
              type="checkbox"
              id="tax-gst-enabled"
              checked={gstEnabled}
              onChange={(e) => setGstEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
          </div>

          {gstEnabled && (
            <>
              {/* GST Rate */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Default GST Rate (%)
                </label>
                <div className="flex gap-2">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-btn border transition-colors ${
                        gstRate === rate
                          ? 'bg-primary text-white border-primary'
                          : 'bg-transparent text-text-primary border-border hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Inclusivity Toggle */}
              <div className="flex items-center justify-between py-1 border-t border-border pt-4">
                <div>
                  <label htmlFor="tax-gst-inclusive" className="text-sm font-semibold text-text-primary cursor-pointer">
                    Prices are GST Inclusive
                  </label>
                  <p className="text-xs text-text-muted mt-0.5">
                    Product shelf selling price already contains tax component
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="tax-gst-inclusive"
                  checked={gstInclusive}
                  onChange={(e) => setGstInclusive(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              {/* GSTIN input */}
              <div className="border-t border-border pt-4">
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Shop GSTIN Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  maxLength={15}
                  value={gst}
                  onChange={(e) => setGst(e.target.value.toUpperCase())}
                  className="w-full text-sm font-mono border border-border rounded-input px-3.5 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  id="input-tax-gstin"
                />
              </div>
            </>
          )}

          {/* Desktop inline save button */}
          <div className="hidden sm:flex justify-end pt-3 border-t border-border">
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={mutation.isPending}
              id="btn-save-tax-desktop"
              className="px-6"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Tax Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Sticky Mobile Save Button */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised safe-bottom"
        style={{ backgroundColor: 'var(--bg-card)' }}
        id="mobile-sticky-save-bar"
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-semibold shadow-sm transition-colors flex items-center justify-center"
          id="btn-save-tax-mobile"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Save Tax Settings
        </button>
      </div>
    </div>
  );
};

export default TaxSettingsPage;
