import React, { useEffect } from 'react';
import { PaymentMode } from '../../api/types';
import { Chip } from '../../components/ui/Chip';
import { Money } from '../../components/Money';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export interface PaymentItemState {
  id: string;
  mode: PaymentMode;
  amount: number;
}

export interface PaymentSectionProps {
  total: number;
  payments: PaymentItemState[];
  selectedMode: 'Cash' | 'UPI' | 'Card' | 'Split';
  onModeChange: (mode: 'Cash' | 'UPI' | 'Card' | 'Split') => void;
  onPaymentsChange: (payments: PaymentItemState[]) => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  total,
  payments,
  selectedMode,
  onModeChange,
  onPaymentsChange,
}) => {
  // Sync payment amounts when total changes in single mode
  useEffect(() => {
    if (selectedMode !== 'Split') {
      onPaymentsChange([
        {
          id: 'single-payment',
          mode: selectedMode,
          amount: Math.max(0, total),
        },
      ]);
    }
  }, [total, selectedMode, onPaymentsChange]);

  const handleSelectMode = (mode: 'Cash' | 'UPI' | 'Card' | 'Split') => {
    onModeChange(mode);
    if (mode === 'Split') {
      const half = Math.round((total / 2) * 100) / 100;
      const rest = Math.round((total - half) * 100) / 100;
      onPaymentsChange([
        { id: Math.random().toString(), mode: 'Cash', amount: half },
        { id: Math.random().toString(), mode: 'UPI', amount: rest },
      ]);
    } else {
      onPaymentsChange([
        {
          id: 'single-payment',
          mode,
          amount: Math.max(0, total),
        },
      ]);
    }
  };

  const handleAddSplitRow = () => {
    onPaymentsChange([
      ...payments,
      { id: Math.random().toString(), mode: 'UPI', amount: 0 },
    ]);
  };

  const handleUpdateSplitRow = (id: string, updates: Partial<PaymentItemState>) => {
    onPaymentsChange(
      payments.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleRemoveSplitRow = (id: string) => {
    if (payments.length <= 1) return;
    onPaymentsChange(payments.filter((p) => p.id !== id));
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const diff = Math.round((total - totalPaid) * 100) / 100;
  const isMismatch = selectedMode === 'Split' && Math.abs(diff) > 0.01;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Payment Mode
        </label>
        {selectedMode === 'Split' && (
          <span className="text-xs font-medium text-text-muted">
            Paid: <Money value={totalPaid} size="sm" /> / <Money value={total} size="sm" />
          </span>
        )}
      </div>

      {/* Mode Chips */}
      <div className="flex flex-wrap gap-2">
        {(['Cash', 'UPI', 'Card', 'Split'] as const).map((mode) => (
          <Chip
            key={mode}
            label={mode}
            selected={selectedMode === mode}
            onClick={() => handleSelectMode(mode)}
            className="px-4 py-2 text-sm font-semibold"
          />
        ))}
      </div>

      {/* Split Payment Rows */}
      {selectedMode === 'Split' ? (
        <div className="space-y-2 pt-2 border-t border-border">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center space-x-2">
              <select
                value={p.mode}
                onChange={(e) =>
                  handleUpdateSplitRow(p.id, { mode: e.target.value as PaymentMode })
                }
                className="px-3 py-2 border border-border rounded-button text-xs font-semibold text-text-primary focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>

              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={p.amount === 0 ? '' : p.amount}
                  onChange={(e) =>
                    handleUpdateSplitRow(p.id, {
                      amount: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 border border-border rounded-button text-sm font-semibold text-text-primary focus:border-primary focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                />
              </div>

              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSplitRow(p.id)}
                  className="p-2 text-text-muted hover:text-danger rounded-button hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddSplitRow}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Payment Split
            </button>

            {isMismatch && (
              <div className="flex items-center text-xs font-bold text-danger">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {diff > 0 ? (
                  <span>Short by ₹{diff.toFixed(2)}</span>
                ) : (
                  <span>Excess by ₹{Math.abs(diff).toFixed(2)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single Mode Summary */
        <div
          className="p-3 border border-border rounded-button flex items-center justify-between text-xs text-text-muted"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <span>Paying full amount via {selectedMode}</span>
          <span className="font-bold text-text-primary">
            <Money value={total} size="sm" />
          </span>
        </div>
      )}
    </div>
  );
};
