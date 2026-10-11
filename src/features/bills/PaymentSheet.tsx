import React, { useState, useEffect } from 'react';
import { Banknote, Smartphone, CreditCard, Split, Check, X } from 'lucide-react';
import { Money } from '../../components/Money';

export interface PaymentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Split';
  onSelectMode: (mode: 'Cash' | 'UPI' | 'Card' | 'Split') => void;
  totalAmount: number;
  payments: Array<{ id: string; mode: 'Cash' | 'UPI' | 'Card'; amount: number }>;
  onUpdatePayments: (payments: Array<{ id: string; mode: 'Cash' | 'UPI' | 'Card'; amount: number }>) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  isOpen,
  onClose,
  paymentMode,
  onSelectMode,
  totalAmount,
  payments,
  onUpdatePayments,
}) => {
  const [selectedMode, setSelectedMode] = useState(paymentMode);
  const [splitCash, setSplitCash] = useState<number | ''>(0);
  const [splitUpi, setSplitUpi] = useState<number | ''>(0);
  const [splitCard, setSplitCard] = useState<number | ''>(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(paymentMode);
      if (paymentMode === 'Split') {
        const cashP = payments.find((p) => p.mode === 'Cash')?.amount || '';
        const upiP = payments.find((p) => p.mode === 'UPI')?.amount || '';
        const cardP = payments.find((p) => p.mode === 'Card')?.amount || '';
        setSplitCash(cashP);
        setSplitUpi(upiP);
        setSplitCard(cardP);
      }
    }
  }, [isOpen, paymentMode, payments]);

  if (!isOpen) return null;

  const handleSelectModeOnly = (mode: 'Cash' | 'UPI' | 'Card' | 'Split') => {
    setSelectedMode(mode);
    if (mode !== 'Split') {
      onSelectMode(mode);
      onUpdatePayments([{ id: 'payment-1', mode, amount: totalAmount }]);
      onClose();
    }
  };

  const handleConfirmSplit = () => {
    const cashAmt = typeof splitCash === 'number' ? splitCash : 0;
    const upiAmt = typeof splitUpi === 'number' ? splitUpi : 0;
    const cardAmt = typeof splitCard === 'number' ? splitCard : 0;

    const list: Array<{ id: string; mode: 'Cash' | 'UPI' | 'Card'; amount: number }> = [];
    if (cashAmt > 0) list.push({ id: 'p-cash', mode: 'Cash', amount: cashAmt });
    if (upiAmt > 0) list.push({ id: 'p-upi', mode: 'UPI', amount: upiAmt });
    if (cardAmt > 0) list.push({ id: 'p-card', mode: 'Card', amount: cardAmt });

    if (list.length === 0) {
      list.push({ id: 'p-cash', mode: 'Cash', amount: totalAmount });
    }

    onSelectMode('Split');
    onUpdatePayments(list);
    onClose();
  };

  const currentSplitTotal =
    (typeof splitCash === 'number' ? splitCash : 0) +
    (typeof splitUpi === 'number' ? splitUpi : 0) +
    (typeof splitCard === 'number' ? splitCard : 0);

  const splitDiff = Math.round((totalAmount - currentSplitTotal) * 100) / 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-3 pb-3 sm:pt-5 flex items-center justify-between border-b border-border/40">
          <h2 className="text-lg font-bold text-text-primary">Payment Mode</h2>
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
          <div className="text-center py-2 bg-secondary/15 rounded-xl border border-border/60">
            <span className="text-xs text-text-muted">Total Payable</span>
            <div className="text-xl font-bold text-text-primary mt-0.5">
              <Money value={totalAmount} />
            </div>
          </div>

          {/* Mode Options */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'Cash', label: 'Cash', icon: Banknote },
              { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
              { id: 'Card', label: 'Card', icon: CreditCard },
              { id: 'Split', label: 'Split', icon: Split },
            ].map(({ id, label, icon: Icon }) => {
              const isSelected = selectedMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectModeOnly(id as any)}
                  className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-border bg-background hover:bg-secondary/20 text-text-primary font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-text-muted'}`} />
                  <span className="text-xs">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Split Mode Breakdown Inputs */}
          {selectedMode === 'Split' && (
            <div className="mt-4 pt-4 border-t border-border/60 space-y-3 animate-in fade-in">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Split Amounts
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs font-semibold text-text-muted">Cash</span>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs font-semibold text-text-muted">UPI</span>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 text-xs font-semibold text-text-muted">Card</span>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="0"
                    className="flex-1 px-3 py-2 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary font-semibold"
                  />
                </div>
              </div>

              {/* Difference Indicator */}
              <div
                className={`text-xs font-semibold flex items-center justify-between pt-1 ${
                  Math.abs(splitDiff) <= 0.01 ? 'text-green-600' : 'text-danger'
                }`}
              >
                <span>Total split: ₹{currentSplitTotal}</span>
                <span>
                  {Math.abs(splitDiff) <= 0.01
                    ? '✓ Matches bill total'
                    : splitDiff > 0
                    ? `Remaining: ₹${splitDiff}`
                    : `Over by: ₹${Math.abs(splitDiff)}`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmSplit}
                disabled={Math.abs(splitDiff) > 0.01}
                className="w-full py-2.5 mt-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm Split Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
