import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Store, Printer, Bell, Percent, Save, Loader2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';

export const ShopSettingsPage: React.FC = () => {
  const params = useParams();
  const defaultShopId = useAuthStore((s) => s.user?.defaultShopID);
  const shopID = params.shopID || params.id || defaultShopId || 's1';

  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({
    CustomerRecommendEnabled: 'true',
    CustomerMandatory: 'false',
    DiscountMode: 'flat',
    ProductSource: 'both',
    DefaultGstRate: '18',
    PricesIncludeGst: 'false',
    RoundingMode: 'round',
    CouponStackingEnabled: 'false',
    ExchangePolicyDays: '14',
    ReceiptFooter: 'Thank you for shopping with us!',
    PrinterType: 'Thermal',
    PrinterName: '',
    WhatsAppEnabled: 'false',
    NotificationEmail: '',
    NotificationSms: 'false',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shop', shopID, 'settings'],
    queryFn: async () => {
      const res = await apiClient.get(`/shops/${shopID}/settings`);
      return res.data;
    },
    enabled: !!shopID,
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
        await apiClient.put(`/shops/${shopID}/settings`, { key, value });
      }
      return updatedSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['shop', shopID, 'settings'], updated);
      toast.success('Shop settings saved successfully');
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save shop settings';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
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
    saveMutation.mutate(formData);
  };

  const isCustomerMandatory = formData.CustomerMandatory?.toLowerCase() === 'true';
  const isCustomerRecommend = formData.CustomerRecommendEnabled?.toLowerCase() === 'true';
  const isCouponStacking = formData.CouponStackingEnabled?.toLowerCase() === 'true';
  const isPricesIncludeGst = formData.PricesIncludeGst?.toLowerCase() === 'true';
  const isWhatsAppOn = formData.WhatsAppEnabled?.toLowerCase() === 'true';
  const isNotificationSmsOn = formData.NotificationSms?.toLowerCase() === 'true';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-8" id="shop-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Shop Settings"
          subtitle="Branch-level POS policies, printer configuration, and tax preferences"
        />

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

          {/* Category 2: Taxes & Pricing Rules */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Percent className="w-4 h-4" /> Taxes & Pricing Rules
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-default-gst">
                  Default GST Rate (%)
                </label>
                <input
                  id="input-default-gst"
                  type="number"
                  min="0"
                  max="40"
                  value={formData.DefaultGstRate || '18'}
                  onChange={(e) => handleInputChange('DefaultGstRate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Standard tax percentage applied on general items.
                </p>
              </div>

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
                  <option value="none">None (Exact decimal cents)</option>
                  <option value="round">Standard Round (Half up)</option>
                  <option value="floor">Floor (Round down)</option>
                  <option value="ceil">Ceil (Round up)</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Rounding algorithm for final bill net payable.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="select-discount-mode">
                  Discount Mode
                </label>
                <select
                  id="select-discount-mode"
                  value={formData.DiscountMode || 'flat'}
                  onChange={(e) => handleInputChange('DiscountMode', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="flat">Flat discount only</option>
                  <option value="percentage">Percentage only</option>
                  <option value="both">Both flat and percentage</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Discount calculation mode available at POS checkout.
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
                  <option value="local">Local shop inventory only</option>
                  <option value="master">Global enterprise catalog only</option>
                  <option value="both">Search both local and central catalog</option>
                </select>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Catalog source used for barcode & product search.
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-prices-include-gst" className="text-sm font-semibold cursor-pointer">
                    Prices Include GST
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Product prices entered are already GST inclusive.
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
                  max="90"
                  value={formData.ExchangePolicyDays || '14'}
                  onChange={(e) => handleInputChange('ExchangePolicyDays', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Number of days returns or exchanges are accepted.
                </p>
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
                  maxLength={60}
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
                  className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Email address receiving daily sales reports.
                </p>
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
