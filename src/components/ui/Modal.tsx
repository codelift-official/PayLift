import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog: Mobile full-screen/bottom-sheet, Desktop centered max-w-md */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl border shadow-modal overflow-hidden transition-all duration-200"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--bg-border)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--bg-border)' }}
        >
          <div className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto flex-1 text-sm space-y-4">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div
            className="px-5 py-3.5 border-t flex items-center justify-end gap-2.5 shrink-0"
            style={{
              borderColor: 'var(--bg-border)',
              backgroundColor: 'var(--bg-app)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
