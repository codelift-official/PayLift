import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { settingsApi } from '../../api/settings';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Receipt, Loader2, Check } from 'lucide-react';

export const ReceiptSettingsPage: React.FC = () => {
  const { shopID } = useParams<{ shopID: string }>();
  const queryClient = useQueryClient();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.find((s) => s.id === shopID) || shops?.[0];
  const targetShopId = activeShop?.id || shopID || '';

  const [exchangePolicyDays, setExchangePolicyDays] = useState(7);
  const [receiptFooter, setReceiptFooter] = useState('');

  useEffect(() => {
    if (activeShop) {
      setExchangePolicyDays(activeShop.exchangePolicyDays ?? 7);
      setReceiptFooter(activeShop.receiptFooter || '');
    }
  }, [activeShop]);

  const mutation = useMutation({
    mutationFn: () =>
      settingsApi.updateReceiptSettings(targetShopId, {
        exchangePolicyDays,
        receiptFooter,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Receipt settings updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update receipt settings');
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Header */}
      <PageHeader
        title="Receipt Settings"
        subtitle={`Exchange policies and printed footer notes for ${activeShop?.name || 'Shop'}`}
        showBack
        backTo="/settings"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="hidden sm:inline-flex"
          >
            {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
            Save Settings
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <Card className="bg-white border-border shadow-card p-6 space-y-5">
          {/* Exchange Policy */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Exchange Policy Window (Days)
            </label>
            <input
              type="number"
              min={0}
              max={90}
              value={exchangePolicyDays}
              onChange={(e) => setExchangePolicyDays(parseInt(e.target.value, 10) || 0)}
              className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
            <p className="text-[11px] text-text-muted">
              Printed on thermal receipts and enforced in return windows (0 to 90 days).
            </p>
          </div>

          {/* Receipt Footer Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Receipt Footer Note / Terms
            </label>
            <textarea
              rows={4}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="e.g. Thank you for your visit! No cash refunds. Valid bill required for exchange."
              className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-text-muted">
              This message appears at the very bottom of printed and digital WhatsApp receipts.
            </p>
          </div>
        </Card>

        {/* Right Column: Live Mock Receipt Box */}
        <Card className="bg-slate-50 border-border shadow-card p-6 space-y-3 font-mono text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-text-muted border-b border-dashed border-slate-300 pb-2 mb-3">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="font-bold text-[11px] uppercase tracking-wider font-sans">
                Live Receipt Preview
              </span>
            </div>

            <div className="text-center py-2 space-y-1 text-text-muted">
              <p className="font-bold text-text-primary uppercase font-sans text-xs">
                {activeShop?.name || 'Kirana Mart'}
              </p>
              <p className="text-[10px]">{activeShop?.address}</p>
              <p className="text-[10px]">BILL-000101 • 30 Sep 2026</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Grocery Items (x3)</span>
                <span>₹1,200.00</span>
              </div>
              <div className="flex justify-between font-bold text-text-primary pt-1">
                <span>NET TOTAL</span>
                <span>₹1,200.00</span>
              </div>
            </div>
          </div>

          {/* Live Footer Section */}
          <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-1.5">
            {exchangePolicyDays > 0 ? (
              <p className="text-[10px] text-text-muted">
                Items can be exchanged within {exchangePolicyDays} days of purchase.
              </p>
            ) : (
              <p className="text-[10px] text-text-muted">No returns or exchanges applicable.</p>
            )}

            <p className="text-xs font-semibold text-text-primary whitespace-pre-line py-1">
              {receiptFooter || 'Thank you for shopping with us!'}
            </p>

            <div className="flex items-center justify-center space-x-1 text-[9px] text-emerald-600 font-sans font-bold">
              <Check className="w-3 h-3" />
              <span>Billify POS Engine</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sticky Mobile Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-3 px-4 shadow-raised safe-bottom">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-semibold shadow-sm transition-colors flex items-center justify-center"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Save Receipt Settings
        </button>
      </div>
    </div>
  );
};
