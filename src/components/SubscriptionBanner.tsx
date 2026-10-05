import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export const SubscriptionBanner: React.FC = () => {
  const location = useLocation();
  const { status, daysLeft, isGraceUnlimited, isTrialUnlimited, isLoading } = useSubscription();

  // Hidden paths
  const hiddenPrefixes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/setup',
    '/platform',
    '/suspended',
  ];

  const isHidden = hiddenPrefixes.some(
    (prefix) =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
  );

  if (isHidden || isLoading || !status) {
    return null;
  }

  const normalizedStatus = status.trim().toLowerCase();

  // Suspended or Active: Do NOT render unless unlimited grace/trial applies
  if (normalizedStatus === 'suspended' || normalizedStatus === 'active') {
    return null;
  }

  let bannerType: 'amber' | 'danger' | null = null;
  let text = '';

  if (isGraceUnlimited) {
    bannerType = 'amber';
    text = 'Unlimited grace active. Contact support.';
  } else if (isTrialUnlimited) {
    bannerType = 'amber';
    text = 'Extended trial active. Contact support.';
  } else if (normalizedStatus === 'trial') {
    if (daysLeft <= 7) {
      bannerType = 'amber';
      text = `Your trial ends in ${daysLeft} days. Contact support to continue.`;
    } else {
      return null;
    }
  } else if (normalizedStatus === 'grace') {
    if (daysLeft <= 3) {
      bannerType = 'danger';
      text = `Grace period ends in ${daysLeft} days. Your account will be suspended.`;
    } else {
      bannerType = 'amber';
      text = `Your trial has ended. Grace period ends in ${daysLeft} days. Contact support to continue.`;
    }
  } else {
    return null;
  }

  const isAmber = bannerType === 'amber';

  return (
    <div
      role="alert"
      className="w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium border-b transition-colors"
      style={{
        backgroundColor: isAmber
          ? 'rgba(245, 158, 11, 0.12)'
          : 'rgba(220, 38, 38, 0.12)',
        borderColor: isAmber
          ? 'rgba(245, 158, 11, 0.3)'
          : 'rgba(220, 38, 38, 0.3)',
        color: isAmber ? '#B45309' : '#DC2626',
      }}
    >
      <div className="flex items-center space-x-2 min-w-0">
        {isAmber ? (
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <span className="truncate">{text}</span>
      </div>

      <Link
        to="/contact"
        className="px-3 py-1 rounded-md text-xs font-semibold shrink-0 transition-opacity hover:opacity-90 shadow-xs"
        style={{
          backgroundColor: isAmber ? '#D97706' : '#DC2626',
          color: '#FFFFFF',
        }}
      >
        Contact Support
      </Link>
    </div>
  );
};
