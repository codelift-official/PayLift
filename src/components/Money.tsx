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
    lg: 'text-base sm:text-lg font-bold',
    display: 'text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight',
  };

  // Dynamic responsive scaling for high numbers so they fit smoothly in mobile cards
  const getScaledSize = () => {
    if (size === 'display') {
      if (absValue >= 10000000) {
        // 1 Crore+
        return 'text-sm sm:text-base lg:text-xl font-extrabold tracking-tight';
      }
      if (absValue >= 100000) {
        // 1 Lakh+ (e.g. 200000.00)
        return 'text-base sm:text-lg lg:text-2xl font-extrabold tracking-tight';
      }
      return sizeClasses.display;
    }
    if (size === 'lg' && absValue >= 100000) {
      return 'text-sm sm:text-base font-bold';
    }
    return sizeClasses[size];
  };

  return (
    <span
      title={`${isNegative ? '−' : ''}₹${formatted}`}
      className={clsx(
        'font-mono tabular-nums inline-flex items-baseline min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
        getScaledSize(),
        isNegative ? 'text-danger' : 'text-text-primary',
        className
      )}
    >
      {isNegative && <span className="mr-0.5 shrink-0">−</span>}
      <span className="mr-0.5 shrink-0">₹</span>
      <span className="truncate">{formatted}</span>
    </span>
  );
};
