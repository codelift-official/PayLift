import React, { useState, useEffect } from 'react';
import { Percent, IndianRupee, X, Check, Trash2 } from 'lucide-react';
import { Money } from '../../components/Money';

export interface OrderDiscountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  discountType: 'Percentage' | 'Amount';
  discountValue: number | '';
  subtotal: number;
  onApply: (type: 'Percentage' | 'Amount', value: number | '') => void;
  onRemove: () => void;
}

export const OrderDiscountSheet: React.FC<OrderDiscountSheetProps> = ({
  isOpen,
  onClose,
  discountType,
  discountValue,
  subtotal,
  onApply,
  onRemove,
}) => {
  const [type, setType] = useState<'Percentage' | 'Amount'>(discountType);
  const [val, setVal] = useState<number | ''>(discountValue);

  useEffect(() => {
    if (isOpen) {
      setType(discountType);
      setVal(discountValue);
    }
  }, [isOpen, discountType, discountValue]);

  if (!isOpen) return null;

  const numVal = typeof val === 'number' ? val : 0;
  const computedDiscount =
    type === 'Percentage'
      ? Math.round(((subtotal * Math.min(100, numVal)) / 100) * 100) / 100
      : Math.min(subtotal, numVal);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(type, val === '' ? '' : numVal);
    onClose();
  };

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-3 sm:p-4"
    >
      <div
        className="w-full sm:max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[88vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border/40 shrink-0">
          <h2 className="text-lg font-bold text-text-primary">Order Discount</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleApply} className="p-6 space-y-4">
          {/* Mode toggle */}
          <div className="grid grid-cols-2 p-1 bg-secondary/20 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setType('Percentage')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'Percentage'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setType('Amount')}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                type === 'Amount'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              Fixed (₹)
            </button>
          </div>

          {/* Value input */}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
              {type === 'Percentage' ? 'Discount Percentage' : 'Discount Amount'}
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                max={type === 'Percentage' ? '100' : undefined}
                value={val}
                onChange={(e) => setVal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder={type === 'Percentage' ? 'e.g. 10' : 'e.g. 150'}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary font-semibold focus:outline-none"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                {type === 'Percentage' ? '%' : '₹'}
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(type === 'Percentage' ? [5, 10, 15, 20] : [50, 100, 200, 500]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setVal(preset)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  val === preset
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-secondary/20 text-text-muted hover:text-text-primary'
                }`}
              >
                {type === 'Percentage' ? `${preset}%` : `₹${preset}`}
              </button>
            ))}
          </div>

          {/* Preview */}
          {numVal > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl text-xs flex items-center justify-between">
              <span className="text-green-800 dark:text-green-300 font-medium">Customer saves:</span>
              <span className="text-green-800 dark:text-green-300 font-bold text-sm">
                −<Money value={computedDiscount} />
              </span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {typeof discountValue === 'number' && discountValue > 0 && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2.5 text-xs font-bold text-danger hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Discount
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
