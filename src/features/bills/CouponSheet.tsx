import React, { useState } from 'react';
import { Ticket, X, Check, Trash2, Plus, AlertCircle } from 'lucide-react';
import { phase11Api, Coupon } from '../../api/phase11';
import { Money } from '../../components/Money';

export interface CouponSheetProps {
  isOpen: boolean;
  onClose: () => void;
  appliedCoupons: Array<{ code: string; discount: number; coupon?: Coupon }>;
  onApplyCoupon: (code: string) => Promise<boolean>;
  onRemoveCoupon: (code: string) => void;
  allowCouponStacking?: boolean;
  subtotal: number;
}

export const CouponSheet: React.FC<CouponSheetProps> = ({
  isOpen,
  onClose,
  appliedCoupons,
  onApplyCoupon,
  onRemoveCoupon,
  allowCouponStacking = false,
  subtotal,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showAddAnother, setShowAddAnother] = useState(false);

  if (!isOpen) return null;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a coupon code');
      return;
    }

    if (subtotal <= 0) {
      setErrorMsg('Please add items to your bill before applying a coupon');
      return;
    }

    if (appliedCoupons.some((c) => c.code === code)) {
      setErrorMsg('Coupon already applied');
      return;
    }

    if (!allowCouponStacking && appliedCoupons.length >= 1) {
      setErrorMsg('Coupon stacking is not allowed');
      return;
    }

    setIsApplying(true);
    setErrorMsg(null);
    try {
      const res = await phase11Api.validateCoupon({
        code,
        orderAmount: subtotal,
      });

      if (!res.valid) {
        setErrorMsg(res.reason || 'Invalid coupon code or expired');
        return;
      }

      const success = await onApplyCoupon(code);
      if (success) {
        setCouponCode('');
        setErrorMsg(null);
        setShowAddAnother(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid coupon code or expired');
    } finally {
      setIsApplying(false);
    }
  };

  const canAddMore = allowCouponStacking || appliedCoupons.length === 0;

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
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Coupons & Offers</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Applied Coupons List */}
          {appliedCoupons.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Applied Coupons ({appliedCoupons.length})
              </span>
              <div className="space-y-2">
                {appliedCoupons.map((c) => (
                  <div
                    key={c.code}
                    data-testid={`applied-coupon-${c.code}`}
                    className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-green-800 dark:text-green-300 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        {c.code}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                        Discount: −<Money value={c.discount} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveCoupon(c.code)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Remove coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {allowCouponStacking && !showAddAnother && (
                <button
                  type="button"
                  onClick={() => setShowAddAnother(true)}
                  id="add-another-coupon-btn"
                  className="w-full py-2.5 text-xs font-bold text-primary hover:bg-primary/5 border border-dashed border-primary/40 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  + Add coupon
                </button>
              )}
            </div>
          )}

          {/* Coupon Input Form */}
          {(canAddMore || showAddAnother) && (
            <form onSubmit={handleApply} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="coupon-code-input"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setErrorMsg(null);
                    }}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3.5 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary uppercase font-mono font-bold tracking-wider placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:tracking-normal focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    id="apply-coupon-btn"
                    disabled={!couponCode.trim() || isApplying}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm transition-colors shrink-0"
                  >
                    {isApplying ? 'Checking...' : 'Apply'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  id="coupon-error-msg"
                  className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-danger flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </form>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              id="coupon-sheet-done-btn"
              className="w-full py-2.5 bg-secondary/30 hover:bg-secondary/50 text-text-primary text-xs font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
