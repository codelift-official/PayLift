import React from 'react';
import { clsx } from 'clsx';

export type MoneySize = 'sm' | 'md' | 'lg' | 'display';

export interface MoneyProps {
  value: number;
  size?: MoneySize;
  negative?: boolean;
  className?: string;
}

export const Money: React.FC<MoneyProps> = ({
  value,
  size = 'md',
  negative = false,
  className,
}) => {
  const isNegative = negative || value < 0;
  const absValue = Math.abs(value);

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  const sizeClasses: Record<MoneySize, string> = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    display: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
  };

  return (
    <span
      className={clsx(
        'font-mono tabular-nums inline-flex items-baseline',
        sizeClasses[size],
        isNegative ? 'text-danger' : 'text-text-primary',
        className
      )}
    >
      {isNegative && <span className="mr-0.5">−</span>}
      <span className="mr-0.5">₹</span>
      <span>{formatted}</span>
    </span>
  );
};
