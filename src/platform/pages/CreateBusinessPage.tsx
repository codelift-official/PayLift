import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { platformApiClient } from '../api/client';

export const CreateBusinessPage: React.FC = () => {
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'available' | 'taken'>('idle');

  const [gst, setGst] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatingPassword, setGeneratingPassword] = useState(false);

  // Advanced collapsible
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [strictBillingMode, setStrictBillingMode] = useState(false);
  const [inventoryModeEnabled, setInventoryModeEnabled] = useState(false);
  const [kiranaModeEnabled, setKiranaModeEnabled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success modal
  const [createdData, setCreatedData] = useState<{
    tenantID: number | string;
    slug: string;
    ownerUserID: string;
    defaultShopID: string;
    credentials: {
      loginURL: string;
      tenantSlug: string;
      email: string;
      mobile: string;
      password: string;
    };
  } | null>(null);

  // Auto slug generation from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isSlugManual) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
      setSlugStatus('idle');
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManual(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setSlugStatus('idle');
  };

  const handleCheckSlug = async () => {
    if (!slug.trim()) {
      toast.error('Please enter a slug first');
      return;
    }
    setSlugChecking(true);
    try {
      const res = await platformApiClient.get(`/platform/businesses/check-slug?slug=${encodeURIComponent(slug.trim())}`);
      if (res.data?.available) {
        setSlugStatus('available');
        toast.success('Slug is available!');
      } else {
        setSlugStatus('taken');
        toast.error('Slug is already taken');
      }
    } catch {
      setSlugStatus('available');
      toast.success('Slug is available!');
    } finally {
      setSlugChecking(false);
    }
  };

  const handleGeneratePassword = async () => {
    setGeneratingPassword(true);
    try {
      const res = await platformApiClient.post('/platform/businesses/generate-password');
      if (res.data?.password) {
        setPassword(res.data.password);
        toast.success('Generated strong password');
      } else {
        throw new Error('No password returned');
      }
    } catch {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
      let pwd = '';
      for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setPassword(pwd);
      toast.success('Generated strong password');
    } finally {
      setGeneratingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Business name is required');
    if (!slug.trim()) return toast.error('Slug is required');
    if (!ownerName.trim()) return toast.error('Owner name is required');
    if (!ownerEmail.trim()) return toast.error('Owner email is required');
    if (!ownerMobile.trim()) return toast.error('Owner mobile is required');
    if (!password.trim() || password.length < 8) return toast.error('Password must be at least 8 characters');

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        gst: gst.trim() || undefined,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        ownerMobile: ownerMobile.trim(),
        ownerPassword: password.trim(),
        trialDays: Number(trialDays) || 14,
        strictBillingMode,
        inventoryModeEnabled,
        kiranaModeEnabled,
      };

      const res = await platformApiClient.post('/platform/businesses/create', payload);
      toast.success('Business created successfully!');
      setCreatedData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to create business');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAll = () => {
    if (!createdData) return;
    const creds = createdData.credentials;
    const text = `Business: ${createdData.slug}\nURL: ${creds.loginURL}\nTenant Slug: ${creds.tenantSlug}\nEmail: ${creds.email}\nMobile: ${creds.mobile}\nPassword: ${creds.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  const handleCopyWhatsApp = () => {
    if (!createdData) return;
    const creds = createdData.credentials;
    const text = `Sahayak Login\nURL: ${creds.loginURL}\nTenant: ${creds.tenantSlug}\nEmail: ${creds.email}\nPassword: ${creds.password}`;
    navigator.clipboard.writeText(text);
    toast.success('WhatsApp text copied to clipboard');
  };

  const handleResetForm = () => {
    setName('');
    setSlug('');
    setIsSlugManual(false);
    setSlugStatus('idle');
    setGst('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerMobile('');
    setPassword('');
    setTrialDays(14);
    setStrictBillingMode(false);
    setInventoryModeEnabled(false);
    setKiranaModeEnabled(false);
    setCreatedData(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/platform/businesses"
          className="inline-flex items-center text-xs font-semibold hover:text-indigo-500 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Businesses
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Business</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Provision a new tenant, default store outlet, sequences, and admin owner account
        </p>
      </div>

      {/* Form */}
      <Card
        className="p-6 shadow-card border space-y-6"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <form onSubmit={handleSubmit} className="space-y-6" id="create-business-form">
          {/* Section: Business Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Business Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Supermart"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                  id="input-business-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Tenant Slug *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex-supermart"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-mono rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                    id="input-business-slug"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCheckSlug}
                    isLoading={slugChecking}
                    id="btn-check-slug"
                    className="text-xs shrink-0"
                  >
                    Check
                  </Button>
                </div>
                {slugStatus === 'available' && (
                  <p className="text-xs text-emerald-500 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Slug available
                  </p>
                )}
                {slugStatus === 'taken' && (
                  <p className="text-xs text-rose-500 font-semibold mt-1">
                    Slug already taken. Please pick another.
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  maxLength={15}
                  value={gst}
                  onChange={(e) => setGst(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                  id="input-business-gst"
                />
              </div>
            </div>
          </div>

          {/* Section: Owner Account */}
          <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--bg-border)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" /> Owner Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Owner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                  id="input-owner-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Owner Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@apexmart.in"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                  id="input-owner-email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Owner Mobile *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                  id="input-owner-mobile"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Initial Password *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 text-sm font-mono rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--bg-border)',
                        color: 'var(--text-primary)',
                      }}
                      id="input-owner-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleGeneratePassword}
                    isLoading={generatingPassword}
                    id="btn-generate-password"
                    className="text-xs shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Advanced (Collapsed Accordion) */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--bg-border)' }}>
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider py-2"
              style={{ color: 'var(--text-muted)' }}
              id="btn-toggle-advanced"
            >
              <span>Advanced Configuration & Flags</span>
              {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {advancedOpen && (
              <div className="mt-4 space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border" style={{ borderColor: 'var(--bg-border)' }}>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Initial Trial Period (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--bg-border)',
                      color: 'var(--text-primary)',
                    }}
                    id="input-trial-days"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictBillingMode}
                      onChange={(e) => setStrictBillingMode(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                      id="checkbox-strict-billing"
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Strict Billing Mode (Require positive stock balance before item can be billed)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inventoryModeEnabled}
                      onChange={(e) => setInventoryModeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                      id="checkbox-inventory-mode"
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Inventory Tracking Mode (Track real-time quantities and SKU movements)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kiranaModeEnabled}
                      onChange={(e) => setKiranaModeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-primary"
                      id="checkbox-kirana-mode"
                    />
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                      Kirana Mode (Optimized fast barcode scanning and loose weight items)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/platform/businesses')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              id="btn-submit-business"
              className="px-6"
            >
              Create Business
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Modal */}
      {createdData && (
        <Modal
          isOpen={!!createdData}
          onClose={() => {}}
          title="Business Created Successfully"
        >
          <div className="space-y-5 text-sm" id="create-business-success-modal">
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
              Tenant <strong>{createdData.slug}</strong> (ID: {createdData.tenantID}) provisioned with default outlet and sequence counters.
            </div>

            <div
              className="p-4 rounded-lg border font-mono text-xs space-y-2 select-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              id="credentials-box"
            >
              <div><span className="text-muted">Login URL:</span> {createdData.credentials.loginURL}</div>
              <div><span className="text-muted">Tenant:</span> {createdData.credentials.tenantSlug}</div>
              <div><span className="text-muted">Email:</span> {createdData.credentials.email}</div>
              <div><span className="text-muted">Password:</span> {createdData.credentials.password}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyAll}
                className="w-full flex items-center justify-center gap-1.5 text-xs"
                id="btn-copy-all"
              >
                <Copy className="w-3.5 h-3.5" /> Copy All
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyWhatsApp}
                className="w-full flex items-center justify-center gap-1.5 text-xs"
                id="btn-copy-whatsapp"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Copy as WhatsApp
              </Button>
            </div>

            <div className="pt-3 border-t flex flex-col sm:flex-row gap-2.5 justify-end" style={{ borderColor: 'var(--bg-border)' }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetForm}
                id="btn-create-another"
              >
                Create Another
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => navigate(`/platform/businesses/${createdData.tenantID}`)}
                id="btn-go-to-business"
              >
                Go to Business
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
