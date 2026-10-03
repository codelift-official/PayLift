import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { clsx } from 'clsx';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center text-center p-8 bg-card rounded-card border border-border shadow-card max-w-md mx-auto my-8',
        className
      )}
    >
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-text-muted mb-4">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-text-muted mb-6 max-w-xs">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="px-4 py-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-sm font-semibold rounded-button shadow-sm transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
