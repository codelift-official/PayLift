import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { settingsApi } from '../../api/settings';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { toast } from 'sonner';
import { MessageSquare, Mail, Bell, Loader2 } from 'lucide-react';

export const NotificationSettingsPage: React.FC = () => {
  const { shopID } = useParams<{ shopID: string }>();
  const queryClient = useQueryClient();

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  const activeShop = shops?.find((s) => s.id === shopID) || shops?.[0];

  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notificationSms, setNotificationSms] = useState(false);

  useEffect(() => {
    if (activeShop) {
      setWhatsAppEnabled(activeShop.whatsAppEnabled ?? true);
      setNotificationEmail(activeShop.notificationEmail || '');
      setNotificationSms(activeShop.notificationSms ?? false);
    }
  }, [activeShop]);

  const mutation = useMutation({
    mutationFn: () => {
      const effectiveId = (shops?.some((s) => s.id === shopID) ? shopID : undefined) || activeShop?.id || shops?.[0]?.id;
      if (!effectiveId) throw new Error('No valid shop found');
      return settingsApi.updateNotificationSettings(effectiveId, {
        whatsAppEnabled,
        notificationEmail,
        notificationSms,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Notification preferences updated');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save notifications');
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
        title="Notification Settings"
        subtitle={`Alerts and customer communication for ${activeShop?.name || 'Shop'}`}
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

      <Card className="border-border shadow-card p-6 space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* WhatsApp Toggles */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <label className="text-sm font-bold text-text-primary">
                WhatsApp Digital Receipts
              </label>
            </div>
            <p className="text-xs text-text-muted">
              Enable instant receipt link sharing via WhatsApp to customers
            </p>
          </div>
          <input
            type="checkbox"
            checked={whatsAppEnabled}
            onChange={(e) => setWhatsAppEnabled(e.target.checked)}
            className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
          />
        </div>

        {/* Email Notification */}
        <div className="space-y-1.5 pb-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Daily Digest Email
            </label>
          </div>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="storeowner@kiranamart.com"
            className="w-full text-sm border border-border rounded-input px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[11px] text-text-muted">
            End-of-day sales report and GST totals will be emailed here.
          </p>
        </div>

        {/* SMS Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <label className="text-sm font-bold text-text-primary">SMS Alerts</label>
            </div>
            <p className="text-xs text-text-muted">
              Send SMS notifications for high-value orders and void returns
            </p>
          </div>
          <input
            type="checkbox"
            checked={notificationSms}
            onChange={(e) => setNotificationSms(e.target.checked)}
            className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
          />
        </div>
      </Card>

      {/* Sticky Mobile Save Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border p-3 px-4 shadow-raised safe-bottom" style={{ backgroundColor: 'var(--bg-card)' }}>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-button text-xs font-semibold shadow-sm transition-colors flex items-center justify-center"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
          Save Notifications
        </button>
      </div>
    </div>
  );
};
