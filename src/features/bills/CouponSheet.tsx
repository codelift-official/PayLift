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
    if (!code) return;

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 pb-3 sm:pt-5 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">Coupons & Offers</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full"
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
                    placeholder="e.g. SAVE10"
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

          {/* Quick presets / available coupons */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-2">
              Available Offers
            </span>
            <div className="space-y-1.5">
              {[
                { code: 'SAVE10', desc: 'Flat 10% discount on order' },
                { code: 'WELCOME100', desc: 'Flat ₹100 off on order above ₹1,000' },
              ].map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCouponCode(c.code);
                    setErrorMsg(null);
                  }}
                  className="w-full p-2.5 rounded-xl border border-border/80 hover:border-primary/50 bg-background hover:bg-secondary/15 transition-all text-left flex items-center justify-between group"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-text-primary group-hover:text-primary transition-colors">
                      {c.code}
                    </span>
                    <p className="text-[11px] text-text-muted">{c.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Use →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
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
