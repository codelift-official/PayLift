import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftElement, rightElement, icon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-text-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {(leftElement || icon) && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-text-muted">
              {leftElement || icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full px-3.5 py-2.5 border rounded-button text-sm text-text-primary placeholder:text-text-muted transition-colors',
              error
                ? 'border-danger focus-visible:ring-danger'
                : 'border-border focus:border-primary',
              (leftElement || icon) && 'pl-10',
              rightElement && 'pr-10',
              className
            )}
            style={{ backgroundColor: 'var(--bg-input)', ...props.style }}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 flex items-center text-text-muted">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger font-medium mt-1">{error}</p>}
        {!error && hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
