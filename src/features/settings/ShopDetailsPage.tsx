import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { Store, MapPin, Phone, Hash, Loader2 } from 'lucide-react';

export const ShopDetailsPage: React.FC = () => {
  const { shopID } = useParams<{ shopID: string }>();
  const queryClient = useQueryClient();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.find((s) => s.id === shopID) || shops?.[0];
  const targetShopId = activeShop?.id || shopID || '';

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gst, setGst] = useState('');

  useEffect(() => {
    if (activeShop) {
      setName(activeShop.name);
      setAddress(activeShop.address);
      setMobile(activeShop.mobile);
      setGst(activeShop.gst || '');
    }
  }, [activeShop]);

  const mutation = useMutation({
    mutationFn: () =>
      shopsApi.updateShop(targetShopId, {
        name,
        address,
        mobile,
        gst: gst || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop profile updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update shop');
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
    <div className="max-w-2xl mx-auto space-y-6 pb-24 sm:pb-6">
      {/* Header */}
      <PageHeader
        title="Shop Details"
        subtitle={`Update store contact information and tax ID for ${name || 'Store'}`}
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
            Save Shop
          </Button>
        }
      />

      <Card className="bg-white border-border shadow-card p-6 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
            <Store className="w-3.5 h-3.5 mr-1" /> Shop / Outlet Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1" /> Street Address
          </label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Mobile & GST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
              <Phone className="w-3.5 h-3.5 mr-1" /> Contact Phone
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1" /> GSTIN Number
            </label>
            <input
              type="text"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              placeholder="e.g. 27AABCU9603R1ZM"
              className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 uppercase focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </Card>

      {/* Sticky Mobile Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border p-3 px-4 shadow-raised safe-bottom">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-semibold shadow-sm transition-colors flex items-center justify-center"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Save Shop Details
        </button>
      </div>
    </div>
  );
};
