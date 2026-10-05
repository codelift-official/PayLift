import React, { useState } from 'react';
import { X, Minus, Plus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '../../api/returns';
import { BillResponse } from '../../api/types';
import { Money } from '../../components/Money';
import { toast } from 'sonner';

interface ExchangeSheetProps {
  bill: BillResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeSheet: React.FC<ExchangeSheetProps> = ({ bill, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    bill.items.forEach((item) => {
      initial[item.id] = 0;
    });
    return initial;
  });

  const [reasons, setReasons] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const itemsToExchange = bill.items
        .filter((it) => (quantities[it.id] || 0) > 0)
        .map((it) => {
          const qty = quantities[it.id];
          const unitPrice = (it.lineTotal ?? it.price * it.qty) / it.qty;
          return {
            itemName: it.itemName,
            qty,
            amount: Number((unitPrice * qty).toFixed(2)),
            reason: reasons[it.id] || 'Customer exchange',
          };
        });

      if (itemsToExchange.length === 0) {
        throw new Error('Please select at least one item to exchange');
      }

      return returnsApi.createExchange(bill.id, { items: itemsToExchange });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills', bill.id] });
      queryClient.invalidateQueries({ queryKey: ['bills', bill.id, 'returns'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
      queryClient.invalidateQueries({ queryKey: ['bill', bill.id, 'returns'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Exchange registered successfully!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to process exchange');
    },
  });

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, delta: number, maxQty: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const totalExchangeAmount = bill.items.reduce((sum, item) => {
    const qty = quantities[item.id] || 0;
    const unitPrice = (item.lineTotal ?? item.price * item.qty) / item.qty;
    return sum + unitPrice * qty;
  }, 0);

  const totalItemsCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Container: Bottom sheet on mobile, centered modal on desktop */}
      <div
        className="w-full sm:max-w-[560px] h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-card shadow-modal flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div>
            <h2 className="text-base font-bold text-text-primary">Exchange Items</h2>
            <p className="text-xs text-text-muted">
              Bill #{bill.billNumber} • Replacement value calculation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List (Scrollable) */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 divide-y divide-border">
          {bill.items.map((item) => {
            const currentQty = quantities[item.id] || 0;
            const unitPrice = (item.lineTotal ?? item.price * item.qty) / item.qty;

            return (
              <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {item.itemName}
                    </p>
                    <p className="text-xs text-text-muted">
                      Value: <Money value={unitPrice} size="sm" /> • Purchased: {item.qty}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, -1, item.qty)}
                      disabled={currentQty === 0}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-text-primary">
                      {currentQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQtyChange(item.id, 1, item.qty)}
                      disabled={currentQty >= item.qty}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reason Input */}
                {currentQty > 0 && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Reason / Replacement item detail (optional)"
                      value={reasons[item.id] || ''}
                      onChange={(e) =>
                        setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-full text-xs px-3 py-1.5 border border-border rounded-input focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t border-border space-y-3"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-muted">
              Exchanging {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}:
            </span>
            <span className="text-base font-bold text-warning">
              <Money value={totalExchangeAmount} />
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-text-primary rounded-button text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={totalItemsCount === 0 || mutation.isPending}
              className="flex-1 py-2.5 bg-warning hover:bg-amber-600 text-white rounded-button text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              <span>Confirm Exchange</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
