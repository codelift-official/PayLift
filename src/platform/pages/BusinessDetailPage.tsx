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
  IndianRupee,
  Ban,
  CheckCircle2,
  Plus,
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
    | 'grantGrace'
    | 'extendTrial'
    | 'resetTrial'
    | 'activate'
    | 'suspend'
    | 'block'
    | 'unblock'
    | 'impersonate'
    | 'editPlan'
    | 'recordPayment'
    | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal form inputs
  const [days, setDays] = useState<number>(7);
  const [reason, setReason] = useState<string>('');
  const [tier, setTier] = useState<string>('Pro');

  // Billing modal inputs
  const [planName, setPlanName] = useState<string>('Pro');
  const [billingCycle, setBillingCycle] = useState<string>('Monthly');
  const [planAmount, setPlanAmount] = useState<number>(999);
  const [planNextDue, setPlanNextDue] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');

  // Payment modal inputs
  const [paymentAmount, setPaymentAmount] = useState<number>(999);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Queries
  const { data: business, isLoading, refetch: refetchBusiness } = useQuery({
    queryKey: ['platform', 'business', id],
    queryFn: async () => {
      const res = await platformApiClient.get(`/platform/businesses/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: subscriptionDetail, refetch: refetchSubscription } = useQuery({
    queryKey: ['platform', 'business', id, 'subscription'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get(`/platform/businesses/${id}/subscription`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });

  const { data: feesData, refetch: refetchFees } = useQuery({
    queryKey: ['platform', 'business', id, 'fees'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get(`/platform/businesses/${id}/fees`);
        return res.data;
      } catch {
        return { payments: [], totalPaidLifetime: 0 };
      }
    },
    enabled: !!id,
  });

  const { data: subEvents } = useQuery({
    queryKey: ['platform', 'business', id, 'subscription-events'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get(
          `/platform/businesses/${id}/subscription-events?page=1&pageSize=10`
        );
        return Array.isArray(res.data) ? res.data : res.data?.items || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: tenantAudit } = useQuery({
    queryKey: ['platform', 'business', id, 'audit-logs'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get(
          `/platform/audit-logs?tenantId=${id}&page=1&pageSize=10`
        );
        return Array.isArray(res.data) ? res.data : res.data?.items || [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const closeModal = () => {
    setModalType(null);
    setReason('');
    setDays(7);
  };

  const handleActionSuccess = (msg: string) => {
    toast.success(msg);
    closeModal();
    refetchBusiness();
    refetchSubscription();
    refetchFees();
  };

  // Actions
  const handleGrantGrace = async () => {
    if (days < 1 || days > 90) return toast.error('Days must be between 1 and 90');
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/grant-grace`, {
        days: Number(days),
        reason: reason.trim() || 'Grace period granted by platform admin',
      });
      handleActionSuccess(`Granted ${days} days of grace`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to grant grace');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (days < 1 || days > 90) return toast.error('Days must be between 1 and 90');
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/extend-trial`, {
        days: Number(days),
        reason: reason.trim() || 'Trial extended by platform admin',
      });
      handleActionSuccess(`Trial extended by ${days} days`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to extend trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetTrial = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/reset-trial`, {
        days: Number(days),
        reason: reason.trim() || 'Trial reset by platform admin',
      });
      handleActionSuccess(`Trial reset to ${days} days`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to reset trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/activate`, {
        tier,
        reason: reason.trim() || 'Activated by platform admin',
      });
      handleActionSuccess('Business activated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to activate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (reason.trim().length < 5) return toast.error('Please enter a suspension reason (min 5 chars)');
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/suspend`, {
        reason: reason.trim(),
      });
      handleActionSuccess('Business suspended');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to suspend business');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (reason.trim().length < 3) return toast.error('Please enter a reason to block account');
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/block`, {
        reason: reason.trim(),
      });
      handleActionSuccess('Business account blocked');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to block account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/unblock`, {
        reason: reason.trim() || 'Unblocked by platform admin',
      });
      handleActionSuccess('Business account unblocked');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to unblock account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearUnlimited = async () => {
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/clear-unlimited`);
      handleActionSuccess('Unlimited flags cleared');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to clear unlimited flags');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/subscription`, {
        plan: planName,
        billingCycle,
        amount: Number(planAmount),
        nextDueAt: planNextDue ? new Date(planNextDue).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: planNotes.trim(),
      });
      handleActionSuccess('Subscription plan updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return toast.error('Amount must be positive');
    setActionLoading(true);
    try {
      await platformApiClient.post(`/platform/businesses/${id}/fees`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentRef.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });
      handleActionSuccess('Fee payment recorded');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to record payment');
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

      const platformStore = usePlatformAuthStore.getState();
      const backup = {
        platform_at: platformStore.accessToken || '',
        platform_rt: platformStore.refreshToken || '',
        platform_user: platformStore.user,
        businessId: targetId,
        businessName: business?.name || 'Business',
      };
      localStorage.setItem('platform_imp_backup', JSON.stringify(backup));

      const tenantStore = useAuthStore.getState();
      const slug = business?.slug || 'tenant';
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
      toast.error(err.response?.data?.message || 'Failed to start impersonation');
    } finally {
      setActionLoading(false);
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
  const status = (b.subscriptionStatus || b.status || sub.status || 'Trial');
  const isBlocked = status.toLowerCase() === 'blocked';
  const isSuspended = status.toLowerCase() === 'suspended';
  const isUnlimited = sub.isGraceUnlimited || sub.isTrialUnlimited;

  const validUntil = sub.status === 'Grace' ? sub.graceEndsAt : (sub.trialEndsAt || sub.graceEndsAt);
  const activePlan = subscriptionDetail?.currentPlan;
  const isOverdue = activePlan?.isOverdue;

  const shopsList = (b.shops && b.shops.length > 0) ? b.shops : [];
  const usersList = (b.users && b.users.length > 0) ? b.users : [];
  const ownerEmail = b.ownerEmail || b.email || usersList.find((u: any) => u.role === 'BusinessAdmin')?.email || '—';

  return (
    <div className="space-y-6 pb-12" id="business-detail-page">
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">{b.name || 'Business Details'}</h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isBlocked
                  ? 'border-rose-500/30 bg-rose-900/20 text-rose-500'
                  : isSuspended
                  ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                  : status.toLowerCase() === 'active'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : status.toLowerCase() === 'grace'
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400'
              }`}
              id="business-status-badge"
            >
              {status}
            </span>
          </div>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Slug: {b.slug || '—'} · Tenant ID: {id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setModalType('impersonate')}
            className="text-xs"
            id="btn-impersonate"
          >
            Impersonate
          </Button>
        </div>
      </div>

      {/* 1. Business Info Card */}
      <Card
        className="p-5 shadow-card border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <h3
          className="text-xs font-bold uppercase tracking-wider flex items-center mb-4 text-indigo-500"
        >
          <Building2 className="w-4 h-4 mr-1.5" /> Business Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Business Name</p>
            <p className="font-semibold mt-0.5">{b.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tenant Slug</p>
            <p className="font-mono mt-0.5">{b.slug || '—'}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Owner Contact</p>
            <p className="font-semibold mt-0.5">{ownerEmail}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>GSTIN</p>
            <p className="font-mono mt-0.5">{b.gst || 'Not provided'}</p>
          </div>
        </div>
      </Card>

      {/* 2. Subscription Card — Clean 4-Column Grid (C4 / C7) */}
      <Card
        className="p-5 shadow-card border space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
            <CreditCard className="w-4 h-4 mr-1.5" /> Subscription Lifecycle
          </h3>
          {isUnlimited && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400">
              Unlimited Grace Active
            </span>
          )}
        </div>

        {/* Clean 4-Col Grid: Status · Plan | Days Left · Valid Until */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Status</p>
            <p className="font-bold text-base mt-0.5" id="grid-status-val">{status}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Plan / Tier</p>
            <p className="font-bold text-base mt-0.5" id="grid-tier-val">{activePlan?.plan || sub.tier || 'Starter'}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Days Left</p>
            <p className="font-bold text-base mt-0.5 text-indigo-600 dark:text-indigo-400" id="grid-days-left-val">
              {isUnlimited
                ? 'Unlimited'
                : sub.daysLeft !== undefined && sub.daysLeft !== null
                ? `${sub.daysLeft} Days`
                : '—'}
            </p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Valid Until</p>
            <p className="font-mono text-base mt-0.5" id="grid-valid-until-val">
              {validUntil ? new Date(validUntil).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t flex flex-wrap gap-2.5" style={{ borderColor: 'var(--bg-border)' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setModalType('grantGrace');
              setDays(7);
            }}
            id="btn-grant-grace"
          >
            Grant Grace
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setModalType('extendTrial');
              setDays(14);
            }}
            id="btn-extend-trial"
          >
            Extend Trial
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setModalType('resetTrial');
              setDays(14);
            }}
            id="btn-reset-trial"
          >
            Reset Trial
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setModalType('activate')}
            id="btn-activate"
          >
            Activate
          </Button>

          {!isSuspended && !isBlocked && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalType('suspend')}
              className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
              id="btn-suspend"
            >
              Suspend
            </Button>
          )}

          {isUnlimited && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearUnlimited}
              id="btn-clear-unlimited"
            >
              Clear Unlimited
            </Button>
          )}

          {/* Block / Unblock Buttons (C6) */}
          {!isBlocked ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalType('block')}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 font-semibold"
              id="btn-block-account"
            >
              <Ban className="w-3.5 h-3.5 mr-1" /> Block
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setModalType('unblock')}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 font-semibold"
              id="btn-unblock-account"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Unblock
            </Button>
          )}
        </div>
      </Card>

      {/* 3. Billing & Fees Section (C5) */}
      <Card
        className="p-5 shadow-card border space-y-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        id="billing-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--bg-border)' }}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
              <IndianRupee className="w-4 h-4 mr-1.5" /> Billing & Fees Management
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Manage commercial subscription packages, recurring cycles, and manual fee receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activePlan) {
                  setPlanName(activePlan.plan);
                  setBillingCycle(activePlan.billingCycle);
                  setPlanAmount(activePlan.amount);
                  setPlanNextDue(activePlan.nextDueAt ? activePlan.nextDueAt.substring(0, 10) : '');
                  setPlanNotes(activePlan.notes || '');
                }
                setModalType('editPlan');
              }}
              id="btn-edit-plan"
            >
              Edit Plan
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setPaymentAmount(activePlan?.amount || 999);
                setModalType('recordPayment');
              }}
              id="btn-record-payment"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Record Payment
            </Button>
          </div>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: 'var(--bg-border)' }}>
            <p className="text-xs text-muted">Current Plan</p>
            <p className="text-lg font-bold text-text-primary mt-1" id="billing-current-plan">
              {activePlan?.plan || 'Starter'} · {activePlan?.billingCycle || 'Monthly'}
            </p>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              ₹{(activePlan?.amount ?? 0).toLocaleString()} / {activePlan?.billingCycle === 'Yearly' ? 'yr' : 'mo'}
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: 'var(--bg-border)' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Next Due Date</p>
              {isOverdue && (
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30" id="badge-overdue">
                  Overdue
                </span>
              )}
            </div>
            <p className="text-lg font-bold font-mono text-text-primary mt-1" id="billing-next-due">
              {activePlan?.nextDueAt ? new Date(activePlan.nextDueAt).toLocaleDateString() : '—'}
            </p>
            <p className="text-xs text-muted mt-0.5">
              Status: <span className="font-semibold text-text-primary">{activePlan?.status || 'Active'}</span>
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/40" style={{ borderColor: 'var(--bg-border)' }}>
            <p className="text-xs text-muted">Total Paid Lifetime</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1" id="billing-total-paid">
              ₹{(feesData?.totalPaidLifetime ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {feesData?.payments?.length ?? 0} fee transactions recorded
            </p>
          </div>
        </div>

        {/* Payments History Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Payment History</h4>
          {(!feesData?.payments || feesData.payments.length === 0) ? (
            <p className="text-xs text-muted py-4 text-center">No fee payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--bg-border)' }}>
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-muted border-b" style={{ borderColor: 'var(--bg-border)' }}>
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Reference</th>
                    <th className="px-4 py-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                  {feesData.payments.map((p: any) => (
                    <tr key={p.id || p.ID}>
                      <td className="px-4 py-2.5 font-mono">{new Date(p.paidAt || p.PaidAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-600">₹{p.amount || p.Amount}</td>
                      <td className="px-4 py-2.5">{p.method || p.Method}</td>
                      <td className="px-4 py-2.5 font-mono text-muted">{p.reference || p.Reference || '—'}</td>
                      <td className="px-4 py-2.5 text-muted">{p.notes || p.Notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* 4. Shops and Users (Read-only) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shops Card */}
        <Card className="p-5 shadow-card border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
            <Store className="w-4 h-4 mr-1.5" /> Outlets & Shops ({shopsList.length})
          </h3>
          {shopsList.length === 0 ? (
            <p className="text-xs text-muted">No shops registered.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {shopsList.map((s: any) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-text-primary">{s.name}</p>
                    <p className="text-muted text-[11px]">{s.address || 'No address'}</p>
                  </div>
                  <span className="font-mono text-muted">{s.mobile || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Users Card */}
        <Card className="p-5 shadow-card border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
            <Users className="w-4 h-4 mr-1.5" /> Team Members ({usersList.length})
          </h3>
          {usersList.length === 0 ? (
            <p className="text-xs text-muted">No users found.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {usersList.map((u: any) => (
                <div key={u.id || u.userID} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-text-primary">{u.name || u.email}</p>
                    <p className="text-muted text-[11px] font-mono">{u.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-text-muted">
                    {u.role || 'Staff'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 5. Recent Subscription Events (Last 10) */}
      <Card className="p-5 shadow-card border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
          <History className="w-4 h-4 mr-1.5" /> Recent Subscription Events
        </h3>
        {(!subEvents || subEvents.length === 0) ? (
          <p className="text-xs text-muted py-2">No subscription event history found.</p>
        ) : (
          <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--bg-border)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-muted border-b" style={{ borderColor: 'var(--bg-border)' }}>
                <tr>
                  <th className="px-4 py-2.5">Event Type</th>
                  <th className="px-4 py-2.5">Triggered By</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {subEvents.slice(0, 10).map((ev: any, idx: number) => (
                  <tr key={ev.id || idx}>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{ev.eventType || ev.EventType}</td>
                    <td className="px-4 py-2.5 text-muted">{ev.triggeredBy || ev.TriggeredBy || 'System'}</td>
                    <td className="px-4 py-2.5 font-mono text-muted">{new Date(ev.createdAt || ev.CreatedAt).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted">{ev.reason || ev.Reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 6. Recent Audit Log (Last 10) */}
      <Card className="p-5 shadow-card border space-y-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center text-indigo-500">
          <ShieldAlert className="w-4 h-4 mr-1.5" /> Platform Audit Trail
        </h3>
        {(!tenantAudit || tenantAudit.length === 0) ? (
          <p className="text-xs text-muted py-2">No audit log records for this tenant.</p>
        ) : (
          <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--bg-border)' }}>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-muted border-b" style={{ borderColor: 'var(--bg-border)' }}>
                <tr>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {tenantAudit.slice(0, 10).map((al: any, idx: number) => (
                  <tr key={al.id || idx}>
                    <td className="px-4 py-2.5 font-semibold text-text-primary">{al.action || al.Action}</td>
                    <td className="px-4 py-2.5 text-muted">{al.actorEmail || al.ActorEmail || al.actorUserId || 'Platform Admin'}</td>
                    <td className="px-4 py-2.5 font-mono text-muted">{new Date(al.timestamp || al.createdAt || al.Timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-muted">{al.details || al.Details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── MODALS ── */}

      {/* Grant Grace Modal */}
      <Modal isOpen={modalType === 'grantGrace'} onClose={closeModal} title="Grant Grace Period">
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1">Grace Days (1 - 90)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Requested extension for payment processing"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleGrantGrace} isLoading={actionLoading}>Confirm Grace</Button>
          </div>
        </div>
      </Modal>

      {/* Extend Trial Modal */}
      <Modal isOpen={modalType === 'extendTrial'} onClose={closeModal} title="Extend Trial Period">
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1">Days to Add (1 - 90)</label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleExtendTrial} isLoading={actionLoading}>Extend Trial</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Trial Modal */}
      <Modal isOpen={modalType === 'resetTrial'} onClose={closeModal} title="Reset Trial Period">
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1">Trial Days from Today</label>
            <input
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleResetTrial} isLoading={actionLoading}>Reset Trial</Button>
          </div>
        </div>
      </Modal>

      {/* Activate Modal */}
      <Modal isOpen={modalType === 'activate'} onClose={closeModal} title="Activate Subscription">
        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1">Select Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full px-3 py-2 rounded-input border font-medium"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            >
              <option value="Starter">Starter</option>
              <option value="Pro">Pro</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleActivate} isLoading={actionLoading}>Activate Account</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal isOpen={modalType === 'suspend'} onClose={closeModal} title="Suspend Business Account">
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-red-600 font-medium text-xs">
            Suspending will immediately revoke POS access for all staff members of this business.
          </p>
          <div>
            <label className="block font-semibold mb-1">Reason for Suspension *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Non-payment after extended grace period"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              id="input-suspend-reason"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSuspend} isLoading={actionLoading} className="bg-red-600 hover:bg-red-700 text-white" id="btn-confirm-suspend">Confirm Suspension</Button>
          </div>
        </div>
      </Modal>

      {/* Block Account Modal (C6) */}
      <Modal isOpen={modalType === 'block'} onClose={closeModal} title="Block Account">
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
            Blocking will lock all tenant endpoints with a 403 Forbidden error (Account blocked). This requires manual Super Admin action to unblock.
          </div>
          <div>
            <label className="block font-semibold mb-1">Reason for Blocking *</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Terms violation or requested account closure"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              id="input-block-reason"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleBlock} isLoading={actionLoading} className="bg-rose-600 hover:bg-rose-700 text-white" id="btn-confirm-block">
              Block Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Unblock Account Modal (C6) */}
      <Modal isOpen={modalType === 'unblock'} onClose={closeModal} title="Unblock Account">
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-xs text-text-muted">
            Unblocking will restore active status and immediate POS billing access for this tenant.
          </p>
          <div>
            <label className="block font-semibold mb-1">Reason / Notes</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Account verified and reactivated"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              id="input-unblock-reason"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleUnblock} isLoading={actionLoading} id="btn-confirm-unblock">
              Unblock Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Plan Modal (C5) */}
      <Modal isOpen={modalType === 'editPlan'} onClose={closeModal} title="Edit Subscription Plan">
        <form onSubmit={handleSavePlan} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Plan</label>
              <select
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="w-full px-3 py-2 rounded-input border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="w-full px-3 py-2 rounded-input border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Amount (₹)</label>
              <input
                type="number"
                min={0}
                step="any"
                value={planAmount}
                onChange={(e) => setPlanAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-input border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Next Due Date</label>
              <input
                type="date"
                value={planNextDue}
                onChange={(e) => setPlanNextDue(e.target.value)}
                className="w-full px-3 py-2 rounded-input border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Notes (Optional)</label>
            <input
              type="text"
              value={planNotes}
              onChange={(e) => setPlanNotes(e.target.value)}
              placeholder="e.g. Annual renewal discount applied"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={actionLoading} id="btn-save-plan">Save Plan</Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal (C5) */}
      <Modal isOpen={modalType === 'recordPayment'} onClose={closeModal} title="Record Fee Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-input border font-bold"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
                id="input-fee-amount"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-input border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
                id="select-fee-method"
              >
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Transaction Reference</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. UPI/20261007/987654"
              className="w-full px-3 py-2 rounded-input border font-mono"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
              id="input-fee-ref"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Notes</label>
            <input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. October monthly license fee"
              className="w-full px-3 py-2 rounded-input border"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--bg-border)' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={actionLoading} id="btn-save-fee-payment">Record Payment</Button>
          </div>
        </form>
      </Modal>

      {/* Impersonate Modal */}
      <Modal isOpen={modalType === 'impersonate'} onClose={closeModal} title="Impersonate Tenant Owner">
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-muted">
            You are about to start an administrative impersonation session as{' '}
            <strong>{b.name || b.slug}</strong>. You will be redirected to their POS dashboard with BusinessAdmin permissions.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleImpersonate} isLoading={actionLoading}>
              Start Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
