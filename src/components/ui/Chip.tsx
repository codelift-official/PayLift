import React from 'react';
import { clsx } from 'clsx';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  className,
  icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center px-3 py-1.5 rounded-chip text-xs font-semibold transition-all select-none',
        selected
          ? 'bg-primary text-white shadow-sm'
          : 'bg-white border border-border text-text-muted hover:text-text-primary hover:border-slate-300',
        className
      )}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};
