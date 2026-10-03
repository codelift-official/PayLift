import React from 'react';
import { clsx } from 'clsx';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const norm = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  if (norm.includes('paid') || norm.includes('completed') || norm.includes('active')) {
    colorClasses = 'bg-success-soft text-success border-emerald-200';
  } else if (norm.includes('strict')) {
    colorClasses = 'bg-info-soft text-info border-blue-200';
  } else if (norm.includes('return') || norm.includes('refund')) {
    colorClasses = 'bg-red-50 text-danger border-red-200';
  } else if (norm.includes('exchange') || norm.includes('pending') || norm.includes('quote')) {
    colorClasses = 'bg-amber-50 text-warning border-amber-200';
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-semibold border',
        colorClasses,
        className
      )}
    >
      {status}
    </span>
  );
};
