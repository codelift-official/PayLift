import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Store,
  Users,
  History,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { platformApiClient } from '../api/client';
import { usePlatformAuthStore } from '../store/platformAuthStore';
import { useAuthStore } from '../../stores/auth.store';

export const BusinessDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Modal states
  const [modalType, setModalType] = useState<
    'grantGrace' | 'extendTrial' | 'resetTrial' | 'activate' | 'suspend' | 'impersonate' | 'editDates' | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  // Modal form inputs
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState<string>('');
  const [tier, setTier] = useState<string>('Pro');
  const [editTrialDate, setEditTrialDate] = useState<string>('');
  const [editGraceDate, setEditGraceDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const { data: business, isLoading, refetch } = useQuery({
    queryKey: ['platform', 'business', id],
    queryFn: async () => {
      const res = await platformApiClient.get(`/platform/businesses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Recent subscription events (last 20)
  const { data: subEvents } = useQuery({
    queryKey: ['platform', 'business', id, 'subscription-events'],
    queryFn: async () => {
      const res = await platformApiClient.get(
        `/platform/businesses/${id}/subscription-events?page=1&pageSize=20`
      );
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
    enabled: !!id,
  });

  // Recent audit log for tenant (last 20)
  const { data: tenantAudit } = useQuery({
    queryKey: ['platform', 'business', id, 'audit-logs'],
    queryFn: async () => {
      const res = await platformApiClient.get(
        `/platform/audit-logs?tenantId=${id}&page=1&pageSize=20`
      );
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
    enabled: !!id,
  });

  // Fallback shops & users if not returned in business detail
  const { data: tenantDetails } = useQuery({
    queryKey: ['platform', 'business', id, 'tenant-details'],
    queryFn: async () => {
      try {
        const impRes = await platformApiClient.post(`/platform/businesses/${id}/impersonate`);
        const token = impRes.data?.accessToken;
        if (!token) return { shops: [], users: [] };

        const [shopsRes, usersRes] = await Promise.all([
          platformApiClient.get('/api/v1/shops', { headers: { Authorization: `Bearer ${token}` } }),
          platformApiClient.get('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        return {
          shops: Array.isArray(shopsRes.data) ? shopsRes.data : shopsRes.data?.items || [],
          users: Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || [],
        };
      } catch {
        return { shops: [], users: [] };
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const closeModal = () => {
    setModalType(null);
    setReason('');
    setDays(7);
  };

  // Actions
  const handleGrantGrace = async () => {
    if (days < 1 || days > 90) {
      toast.error('Days must be between 1 and 90');
      return;
    }
    if (reason.trim().length < 5 || reason.trim().length > 500) {
      toast.error('Reason must be between 5 and 500 characters');
      return;
    }
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/grant-grace`, {
        days: Number(days),
        reason: reason.trim(),
      });
      toast.success('Grace period granted successfully');
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grant grace period');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (days < 1 || days > 180) {
      toast.error('Days must be between 1 and 180');
      return;
    }
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/extend-trial`, {
        days: Number(days),
        reason: reason.trim(),
      });
      toast.success('Trial extended successfully');
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extend trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTrial = async () => {
    if (days < 1 || days > 180) {
      toast.error('Days must be between 1 and 180');
      return;
    }
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/reset-trial`, {
        days: Number(days),
        reason: reason.trim(),
      });
      toast.success('Trial reset successfully');
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/activate`, {
        tier,
        reason: reason.trim(),
      });
      toast.success(`Business activated on ${tier} tier`);
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to activate business');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/suspend`, {
        reason: reason.trim(),
      });
      toast.success('Business suspended');
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to suspend business');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = async () => {
    setActionLoading(true);
    const targetId = business?.tenantID || id;
    try {
      const res = await platformApiClient.post(`/platform/businesses/${targetId}/impersonate`);
      const { accessToken, refreshToken, user, impersonatedUserID, impersonatedEmail } = res.data;

      // 1. Save platform tokens to platform_imp_backup
      const platformStore = usePlatformAuthStore.getState();
      const backup = {
        platform_at: platformStore.accessToken || '',
        platform_rt: platformStore.refreshToken || '',
        platform_user: platformStore.user,
        businessId: targetId,
        businessName: business?.name || 'Business',
      };
      localStorage.setItem('platform_imp_backup', JSON.stringify(backup));

      // 2. Replace tenant tokens with impersonation token
      const tenantStore = useAuthStore.getState();
      const slug = business?.slug || (Number(targetId) === 2 ? 'apex-retail' : 'tenant');
      tenantStore.setTenantSlug(slug);
      tenantStore.setTokens(accessToken, refreshToken || accessToken);
      tenantStore.setUser(user || {
        userID: impersonatedUserID || 'impersonated-user',
        tenantID: Number(targetId) || 1,
        role: 'BusinessAdmin',
        email: impersonatedEmail || business?.ownerEmail || 'admin@apexretail.com',
      });

      toast.success(`Impersonating ${business?.name || slug}`);
      closeModal();
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to start impersonation');
    } finally {
      setActionLoading(false);
    }
  };

  React.useEffect(() => {
    if (business) {
      const sub = business.subscription || business;
      setNotes(sub.subscriptionNotes || business.subscriptionNotes || '');
      setEditTrialDate(sub.trialEndsAt ? String(sub.trialEndsAt).substring(0, 10) : '');
      setEditGraceDate(sub.graceEndsAt ? String(sub.graceEndsAt).substring(0, 10) : '');
    }
  }, [business]);

  const handleGrantUnlimitedGrace = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/grant-unlimited-grace`);
      toast.success('Unlimited grace granted successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grant unlimited grace');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearUnlimited = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/clear-unlimited`);
      toast.success('Unlimited flags cleared successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear unlimited flags');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSubscriptionDates = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/subscription-dates`, {
        trialEndsAt: editTrialDate ? new Date(editTrialDate).toISOString() : null,
        graceEndsAt: editGraceDate ? new Date(editGraceDate).toISOString() : null,
      });
      toast.success('Subscription dates updated successfully');
      closeModal();
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update subscription dates');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    const targetId = business?.tenantID || id;
    try {
      await platformApiClient.put(`/platform/businesses/${targetId}/subscription-notes`, {
        notes: notes.trim(),
      });
      toast.success('Subscription notes saved successfully');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setNotesSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const b = business || {};
  const sub = b.subscription || b;

  const shopsList = (b.shops && b.shops.length > 0) ? b.shops : (tenantDetails?.shops || []);
  const usersList = (b.users && b.users.length > 0) ? b.users : (tenantDetails?.users || []);
  const ownerEmail = b.ownerEmail || b.email || usersList.find((u: any) => u.role === 'BusinessAdmin')?.email || '—';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{b.name || 'Business Details'}</h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Slug: {b.slug || '—'} · Tenant ID: {id}
          </p>
        </div>
      </div>

      {/* 1. Business Info Card */}
      <Card
        className="p-5 shadow-card border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <Building2 className="w-4 h-4 mr-1.5 text-indigo-500" /> Business Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Business Name</p>
            <p className="font-semibold mt-0.5">{b.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Slug</p>
            <p className="font-mono mt-0.5">{b.slug || '—'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner Email</p>
            <p className="font-semibold mt-0.5">{ownerEmail}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>GSTIN</p>
            <p className="font-mono mt-0.5">{b.gst || 'Not provided'}</p>
          </div>
        </div>
      </Card>

      {/* 2. Subscription Card */}
      <Card
        className="p-5 shadow-card border space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--bg-border)' }}>
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <CreditCard className="w-4 h-4 mr-1.5 text-indigo-500" /> Subscription Management
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Tier: {sub.tier || 'Starter'}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                sub.status === 'Active'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : sub.status === 'Suspended'
                  ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              Status: {sub.status || 'Trial'}
            </span>
            {(sub.isGraceUnlimited || sub.isTrialUnlimited) && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Unlimited
              </span>
            )}
          </div>
        </div>

        {/* Meaningful, Usable Subscription Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Status & Plan</p>
            <p className="font-semibold text-sm mt-0.5">{sub.tier || 'Starter'} — {sub.status || 'Trial'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Time Remaining</p>
            <p className="font-bold text-base mt-0.5 text-indigo-600 dark:text-indigo-400">
              {(sub.isGraceUnlimited || sub.isTrialUnlimited)
                ? 'Unlimited Access'
                : `${sub.daysLeft !== undefined && sub.daysLeft !== null ? sub.daysLeft : '—'} Days Left`}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>{sub.status === 'Grace' ? 'Grace Ends At' : 'Trial Ends At'}</p>
            <p className="font-mono text-sm mt-0.5">
              {(sub.graceEndsAt || sub.trialEndsAt)
                ? new Date(sub.graceEndsAt || sub.trialEndsAt).toLocaleDateString()
                : '—'}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Registered On</p>
            <p className="font-mono text-sm mt-0.5">
              {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
            </p>
          </div>
          {sub.status === 'Suspended' && sub.suspendedReason && (
            <div className="col-span-full p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 text-xs">
              <span className="font-bold">Suspension Reason:</span> {sub.suspendedReason}
            </div>
          )}
        </div>

        {/* Action Buttons: [Grant Grace] [Extend Trial] [Reset Trial] [Activate] [Suspend] [Impersonate Owner] [Grant Unlimited Grace] [Clear Unlimited] [Edit Dates] */}
        <div className="pt-4 border-t flex flex-wrap gap-2.5" style={{ borderColor: 'var(--bg-border)' }}>
          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => {
              setModalType('grantGrace');
              setDays(7);
            }}
          >
            Grant Grace
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => {
              setModalType('extendTrial');
              setDays(14);
            }}
          >
            Extend Trial
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => {
              setModalType('resetTrial');
              setDays(14);
            }}
          >
            Reset Trial
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={handleGrantUnlimitedGrace}
            isLoading={actionLoading}
          >
            Grant Unlimited Grace
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={handleClearUnlimited}
            isLoading={actionLoading}
          >
            Clear Unlimited
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => setModalType('editDates')}
          >
            Edit Dates
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="text-xs py-1.5 px-3"
            onClick={() => {
              setModalType('activate');
              setTier('Pro');
            }}
          >
            Activate
          </Button>

          <Button
            type="button"
            variant="danger"
            className="text-xs py-1.5 px-3"
            onClick={() => setModalType('suspend')}
          >
            Suspend
          </Button>

          <Button
            type="button"
            className="text-xs py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500"
            onClick={() => setModalType('impersonate')}
          >
            Impersonate Owner
          </Button>
        </div>
      </Card>

      {/* Subscription Notes Card */}
      <Card
        className="p-5 shadow-card border space-y-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <CreditCard className="w-4 h-4 mr-1.5 text-indigo-500" /> Subscription Notes
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveNotes}
            isLoading={notesSaving}
            className="text-xs py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
          >
            Save Notes
          </Button>
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes regarding this tenant's subscription, offline terms, extensions..."
          className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--bg-border)',
            color: 'var(--text-primary)',
          }}
        />
      </Card>

      {/* 3. Shops List (read-only) */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <Store className="w-4 h-4 mr-1.5 text-indigo-500" /> Shops (Read-only)
          </h3>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {shopsList.length} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Location</th>
                <th className="px-5 py-2.5">Phone</th>
                <th className="px-5 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {shopsList.length > 0 ? (
                shopsList.map((shop: any) => (
                  <tr key={shop.id || shop.ID}>
                    <td className="px-5 py-2.5 font-semibold">{shop.name || shop.Name}</td>
                    <td className="px-5 py-2.5" style={{ color: 'var(--text-muted)' }}>
                      {shop.address || shop.Address || shop.location || '—'}
                    </td>
                    <td className="px-5 py-2.5">{shop.mobile || shop.Mobile || shop.phone || '—'}</td>
                    <td className="px-5 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {(shop.createdAt || shop.CreatedAt) ? new Date(shop.createdAt || shop.CreatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No shop locations listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Users List (read-only) */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <Users className="w-4 h-4 mr-1.5 text-indigo-500" /> Users (Read-only)
          </h3>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {usersList.length} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-2.5">Email</th>
                <th className="px-5 py-2.5">Name</th>
                <th className="px-5 py-2.5">Role</th>
                <th className="px-5 py-2.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {usersList.length > 0 ? (
                usersList.map((user: any) => (
                  <tr key={user.userID || user.id || user.UserID}>
                    <td className="px-5 py-2.5 font-semibold">{user.email || user.Email}</td>
                    <td className="px-5 py-2.5">{user.name || user.Name || user.mobile || user.Mobile || '—'}</td>
                    <td className="px-5 py-2.5 font-medium">{user.role || user.Role}</td>
                    <td className="px-5 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {(user.createdAt || user.CreatedAt) ? new Date(user.createdAt || user.CreatedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No users listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. Recent Subscription Events (last 20) */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <History className="w-4 h-4 mr-1.5 text-indigo-500" /> Recent Subscription Events (Last 20)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-2.5">Timestamp</th>
                <th className="px-5 py-2.5">Event</th>
                <th className="px-5 py-2.5">Performed By</th>
                <th className="px-5 py-2.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {subEvents && subEvents.length > 0 ? (
                subEvents.map((evt: any, i: number) => (
                  <tr key={evt.id || i}>
                    <td className="px-5 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2.5 font-semibold text-indigo-500">
                      {evt.eventType || evt.event || 'UPDATED'}
                    </td>
                    <td className="px-5 py-2.5">{evt.performedBy || 'Admin'}</td>
                    <td className="px-5 py-2.5" style={{ color: 'var(--text-muted)' }}>
                      {evt.reason || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No subscription events recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. Recent Audit Log for Tenant (last 20) */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <h3
            className="text-xs font-bold uppercase tracking-wider flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <ShieldAlert className="w-4 h-4 mr-1.5 text-indigo-500" /> Recent Tenant Audit Log (Last 20)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-2.5">Time</th>
                <th className="px-5 py-2.5">Admin</th>
                <th className="px-5 py-2.5">Action</th>
                <th className="px-5 py-2.5">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {tenantAudit && tenantAudit.length > 0 ? (
                tenantAudit.map((log: any, i: number) => (
                  <tr key={log.id || i}>
                    <td className="px-5 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-2.5">{log.admin || log.performedBy || 'Admin'}</td>
                    <td className="px-5 py-2.5 font-semibold font-mono text-indigo-500">
                      {log.action}
                    </td>
                    <td className="px-5 py-2.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.ip || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No audit records for this tenant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── MODALS ────────────────────────────────────────────── */}

      {/* Grant Grace Modal */}
      <Modal
        open={modalType === 'grantGrace'}
        title="Grant Grace Period"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              onClick={handleGrantGrace}
              isLoading={actionLoading}
            >
              Grant Grace
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Days (1..90)
            </label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Reason (5..500 characters)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the justification for granting this grace period..."
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Extend Trial Modal */}
      <Modal
        open={modalType === 'extendTrial'}
        title="Extend Trial"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              onClick={handleExtendTrial}
              isLoading={actionLoading}
            >
              Extend Trial
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Days (1..180)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for trial extension..."
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Reset Trial Modal */}
      <Modal
        open={modalType === 'resetTrial'}
        title="Reset Trial"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              onClick={handleResetTrial}
              isLoading={actionLoading}
            >
              Reset Trial
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Days (1..180)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for trial reset..."
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Activate Modal */}
      <Modal
        open={modalType === 'activate'}
        title="Activate Subscription"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={handleActivate}
              isLoading={actionLoading}
            >
              Activate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-medium"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Reason
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for activation..."
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        open={modalType === 'suspend'}
        title="Suspend Business Account"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSuspend}
              isLoading={actionLoading}
            >
              Suspend
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-danger font-medium">
            Suspending this account will immediately block access to the POS terminal and business services.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Reason (Required)
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a mandatory reason for suspending this business..."
              className="w-full px-3 py-2 text-sm rounded-input border focus:ring-2 focus:ring-danger focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
      </Modal>

      {/* Impersonate Modal */}
      <Modal
        open={modalType === 'impersonate'}
        title="Impersonate owner?"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-500 text-white font-semibold"
              onClick={handleImpersonate}
              isLoading={actionLoading}
            >
              Impersonate
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          You will access the tenant app as the owner. Every action will be logged.
          Session expires in 30 minutes.
        </p>
      </Modal>

      {/* Edit Dates Modal */}
      <Modal
        open={modalType === 'editDates'}
        title="Edit Subscription Dates"
        onClose={closeModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
              onClick={handleSaveSubscriptionDates}
              isLoading={actionLoading}
            >
              Save Dates
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Trial Ends At
            </label>
            <input
              type="date"
              value={editTrialDate}
              onChange={(e) => setEditTrialDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              Grace Ends At
            </label>
            <input
              type="date"
              value={editGraceDate}
              onChange={(e) => setEditGraceDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
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
