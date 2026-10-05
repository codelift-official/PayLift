import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

export interface SubscriptionInfo {
  status: string;
  tier: string;
  trialEndsAt?: string | null;
  graceEndsAt?: string | null;
  daysLeft: number;
  suspendedReason?: string | null;
  isGraceUnlimited?: boolean;
  isTrialUnlimited?: boolean;
  subscriptionNotes?: string | null;
}

export function useSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<SubscriptionInfo> => {
      const res = await apiClient.get('/api/v1/business/subscription');
      const d = res.data || {};
      return {
        status: d.status || d.Status || res.headers['x-subscription-status'] || 'Active',
        tier: d.tier || d.Tier || res.headers['x-subscription-tier'] || 'Starter',
        trialEndsAt: d.trialEndsAt || d.TrialEndsAt || null,
        graceEndsAt: d.graceEndsAt || d.GraceEndsAt || null,
        daysLeft:
          typeof d.daysLeft === 'number'
            ? d.daysLeft
            : typeof d.DaysLeft === 'number'
            ? d.DaysLeft
            : parseInt(res.headers['x-subscription-days-left'] || '0', 10) || 0,
        suspendedReason: d.suspendedReason || d.SuspendedReason || null,
        isGraceUnlimited: Boolean(d.isGraceUnlimited ?? d.IsGraceUnlimited ?? false),
        isTrialUnlimited: Boolean(d.isTrialUnlimited ?? d.IsTrialUnlimited ?? false),
        subscriptionNotes: d.subscriptionNotes ?? d.SubscriptionNotes ?? null,
      };
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    enabled: isAuthenticated,
  });

  return {
    status: data?.status ?? null,
    tier: data?.tier ?? null,
    trialEndsAt: data?.trialEndsAt ?? null,
    graceEndsAt: data?.graceEndsAt ?? null,
    daysLeft: data?.daysLeft ?? 0,
    suspendedReason: data?.suspendedReason ?? null,
    isGraceUnlimited: data?.isGraceUnlimited ?? false,
    isTrialUnlimited: data?.isTrialUnlimited ?? false,
    subscriptionNotes: data?.subscriptionNotes ?? null,
    isLoading,
    error,
    refetch,
  };
}
