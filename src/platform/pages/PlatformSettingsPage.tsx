import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Shield, Clock, Save, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { platformApiClient } from '../api/client';

export const PlatformSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, string>>({
    DefaultTrialDays: '14',
    DefaultGraceDays: '7',
    MaxGraceDays: '90',
    MaxTrialDays: '180',
    OverdueSuspendAfterDays: '15',
    DisablePublicBusinessSignup: 'false',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'settings'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/settings');
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
      // Save all changed keys
      for (const [key, value] of Object.entries(updatedSettings)) {
        await platformApiClient.put('/platform/settings', { key, value });
      }
      return updatedSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['platform', 'settings'], updated);
      toast.success('Platform settings saved successfully');
      setFormError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save platform settings';
      setFormError(msg);
      toast.error(msg);
    },
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    saveMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 sm:pb-8" id="platform-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Platform Settings
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Global configurations and subscription defaults for all tenants
          </p>
        </div>

        {/* Desktop Save Button */}
        <div className="hidden sm:block">
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            id="btn-save-platform-settings-desktop"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Platform Settings
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
          {/* Category 1: Trial & Grace Policies */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Trial & Grace Policies
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-default-trial">
                  Default Trial Days
                </label>
                <input
                  id="input-default-trial"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.DefaultTrialDays || '14'}
                  onChange={(e) => handleInputChange('DefaultTrialDays', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Trial length in days for new tenant accounts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-default-grace">
                  Default Grace Days
                </label>
                <input
                  id="input-default-grace"
                  type="number"
                  min="1"
                  max="90"
                  value={formData.DefaultGraceDays || '7'}
                  onChange={(e) => handleInputChange('DefaultGraceDays', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Grace period in days after trial ends.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-max-trial">
                  Max Trial Days
                </label>
                <input
                  id="input-max-trial"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.MaxTrialDays || '180'}
                  onChange={(e) => handleInputChange('MaxTrialDays', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Maximum trial duration days that can be granted.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-max-grace">
                  Max Grace Days
                </label>
                <input
                  id="input-max-grace"
                  type="number"
                  min="1"
                  max="180"
                  value={formData.MaxGraceDays || '90'}
                  onChange={(e) => handleInputChange('MaxGraceDays', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Maximum grace days that can be granted.
                </p>
              </div>
            </div>
          </Card>

          {/* Category 2: Account Lifecycle & Access */}
          <Card
            className="p-6 border shadow-card space-y-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
          >
            <div className="border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Account Lifecycle & Access
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" htmlFor="input-overdue-suspend">
                  Overdue Suspend Threshold (Days)
                </label>
                <input
                  id="input-overdue-suspend"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.OverdueSuspendAfterDays || '15'}
                  onChange={(e) => handleInputChange('OverdueSuspendAfterDays', e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-md border focus:ring-2 focus:ring-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--bg-border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Days overdue before account is auto-suspended.
                </p>
              </div>

              <div className="pt-4 border-t flex items-start justify-between gap-4" style={{ borderColor: 'var(--bg-border)' }}>
                <div className="space-y-0.5">
                  <label htmlFor="toggle-disable-signup" className="text-sm font-semibold cursor-pointer">
                    Disable Public Business Signup
                  </label>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Disable public self-serve registration.
                  </p>
                </div>
                <button
                  id="toggle-disable-signup"
                  type="button"
                  role="switch"
                  aria-checked={formData.DisablePublicBusinessSignup === 'true'}
                  onClick={() => handleToggle('DisablePublicBusinessSignup')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.DisablePublicBusinessSignup === 'true' ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formData.DisablePublicBusinessSignup === 'true' ? 'translate-x-5' : 'translate-x-0'
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
              id="btn-save-platform-settings-mobile"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Platform Settings
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
