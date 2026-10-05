import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, Phone, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useAuthStore, isBusinessAdmin } from '../../../stores/auth.store';
import { useAccessibleShops } from '../../../hooks/useAccessibleShops';
import { whatsappApi, WhatsAppConfig } from '../../../api/whatsapp';

export const WhatsAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isBusinessAdmin(user);
  const { shops, defaultShop, isLoading: isShopsLoading } = useAccessibleShops();
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (defaultShop?.id && !selectedShopId) {
      setSelectedShopId(defaultShop.id);
    } else if (shops[0]?.id && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [defaultShop, shops, selectedShopId]);

  const currentShopId = selectedShopId || defaultShop?.id || shops[0]?.id || 's1';

  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('+91');
  const [testLoading, setTestLoading] = useState(false);

  // Form State
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [hasExistingToken, setHasExistingToken] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Fetch config whenever currentShopId changes
  useEffect(() => {
    if (!currentShopId) return;

    let mounted = true;
    setLoadingConfig(true);
    whatsappApi
      .getConfig(currentShopId)
      .then((cfg) => {
        if (!mounted) return;
        setPhoneNumberId(cfg.phoneNumberId || '');
        setWabaId(cfg.wabaId || '');
        setVerifyToken(cfg.verifyToken || '');
        setIsActive(Boolean(cfg.isActive));
        setHasExistingToken(Boolean(cfg.hasAccessToken || cfg.accessToken));
        setAccessToken(cfg.hasAccessToken || cfg.accessToken ? '••••••••••••••••••••' : '');
      })
      .catch((err) => {
        console.error('Failed to load WhatsApp config:', err);
      })
      .finally(() => {
        if (mounted) setLoadingConfig(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentShopId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumberId.trim()) {
      toast.error('Phone Number ID is required');
      return;
    }

    if (!verifyToken.trim()) {
      toast.error('Verify Token is required');
      return;
    }

    if (!hasExistingToken && !accessToken.trim()) {
      toast.error('Access Token is required');
      return;
    }

    setSaving(true);
    try {
      if (!accessToken.trim() || accessToken.startsWith('•••')) {
        toast.error('Please enter your Meta Graph Access Token (minimum 20 characters) to save');
        setSaving(false);
        return;
      }

      const payload: WhatsAppConfig = {
        shopId: currentShopId,
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim() || undefined,
        verifyToken: verifyToken.trim(),
        isActive,
        accessToken: accessToken.trim(),
      };

      await whatsappApi.saveConfig(payload);
      setHasExistingToken(true);
      setAccessToken('••••••••••••••••••••');
      toast.success('WhatsApp Business configuration saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to save WhatsApp configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone.trim() || testPhone.trim() === '+91') {
      toast.error('Please enter a valid recipient phone number with country code');
      return;
    }

    setTestLoading(true);
    try {
      const res = await whatsappApi.testConnection({
        shopId: currentShopId,
        recipientPhone: testPhone.trim(),
      });
      toast.success(res.message || 'Test message dispatched successfully');
      setTestModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to send test message');
    } finally {
      setTestLoading(false);
    }
  };

  if (!isAdmin && user?.role !== 'Manager') {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          You do not have permission to view or manage WhatsApp configuration.
        </p>
      </div>
    );
  }

  const selectedShop = shops.find((s) => s.id === currentShopId) || shops[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="WhatsApp Business API"
        subtitle="Configure Cloud API credentials to dispatch digital receipts and notifications."
        showBack
        backTo="/settings"
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings/whatsapp/dashboard')}
            className="flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Usage Dashboard</span>
          </Button>
        }
      />

      {/* Shop Selector */}
      <Card className="p-4 border shadow-xs" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Configuring Shop
            </label>
            {isAdmin && shops.length > 1 ? (
              <select
                value={currentShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                disabled={isShopsLoading}
                className="px-3 py-1.5 text-sm rounded-input border font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>{selectedShop?.name || 'Default Shop'}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono border" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>
                  ID: {currentShopId}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isActive
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
              {isActive ? 'Active on Shop' : 'Disabled'}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Settings Form */}
      <Card className="p-6 border shadow-card" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--bg-border)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Meta Cloud API Credentials</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Acquire these credentials from Meta for Developers WhatsApp App dashboard.
                </p>
              </div>
            </div>

            {/* Is Active Toggle */}
            <label className="flex items-center cursor-pointer gap-2.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Enable WhatsApp</span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Phone Number ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Phone Number ID <span className="text-danger">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. 104928172648192"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                disabled={loadingConfig}
                required
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Found in Meta WhatsApp {'>'} API Setup section.
              </p>
            </div>

            {/* WABA ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                WhatsApp Business Account (WABA) ID <span className="text-xs text-text-muted font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. 918273645019283"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                disabled={loadingConfig}
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Optional identifier for multi-number management.
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Permanent System User Access Token <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder={hasExistingToken ? '••••••••••••••••••••' : 'EAAG...'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  onFocus={() => {
                    if (hasExistingToken && accessToken.startsWith('•••')) {
                      setAccessToken('');
                    }
                  }}
                  disabled={loadingConfig}
                  required={!hasExistingToken}
                />
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {hasExistingToken
                  ? 'Access token is securely stored and masked. Enter a new token to overwrite.'
                  : 'Meta System User token with whatsapp_business_messaging permissions.'}
              </p>
            </div>

            {/* Verify Token */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Webhook Verify Token <span className="text-danger">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. custom_secure_token_123"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                disabled={loadingConfig}
                required
              />
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Secret token used when configuring the Meta webhook callback.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--bg-border)' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTestModalOpen(true)}
              disabled={loadingConfig || !phoneNumberId}
              className="text-xs"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Test Connection
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                isLoading={saving}
                disabled={loadingConfig}
                className="text-xs px-5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Save Config
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Test Connection Modal */}
      <Modal
        open={testModalOpen}
        title="Test WhatsApp Connection"
        onClose={() => setTestModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestModalOpen(false)} disabled={testLoading}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={handleTestConnection}
              isLoading={testLoading}
            >
              Send Test Message
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Send an instant test ping via Meta Cloud API to verify credentials and phone number verification status.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Test Recipient Mobile Number (with country code)
            </label>
            <input
              type="text"
              placeholder="+919876543210"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
