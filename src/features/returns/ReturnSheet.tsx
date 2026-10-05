import React, { useState, useMemo } from 'react';
import { X, Minus, Plus, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnsApi } from '../../api/returns';
import { BillResponse, ReturnExchangeResponse } from '../../api/types';
import { Money } from '../../components/Money';
import { toast } from 'sonner';

interface ReturnSheetProps {
  bill: BillResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const ReturnSheet: React.FC<ReturnSheetProps> = ({ bill, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  // Load existing returns for this bill
  const { data: existingReturns } = useQuery<ReturnExchangeResponse[]>({
    queryKey: ['bills', bill.id, 'returns'],
    queryFn: () => returnsApi.getBillReturns(bill.id),
    enabled: isOpen,
    staleTime: 10_000,
  });

  // Compute already-returned qty per item name
  const alreadyReturnedMap = useMemo(() => {
    const map: Record<string, number> = {};
    const allReturns: any[] =
      existingReturns && existingReturns.length > 0
        ? existingReturns
        : (bill as any)?.returns || [];

    allReturns
      .filter((r) => r.type === 'Return')
      .forEach((r) => {
        const key = r.itemName.toLowerCase();
        map[key] = (map[key] || 0) + r.qty;
      });

    // Also check direct item.returnedQty
    bill.items.forEach((item) => {
      const direct = (item as any).returnedQty;
      if (typeof direct === 'number' && direct > 0) {
        const key = item.itemName.toLowerCase();
        map[key] = Math.max(map[key] || 0, direct);
      }
    });

    return map;
  }, [existingReturns, bill]);

  // Remaining returnable qty per item
  const remainingMap = useMemo(() => {
    const map: Record<string, number> = {};
    bill.items.forEach((item) => {
      const alreadyReturned = alreadyReturnedMap[item.itemName.toLowerCase()] || 0;
      map[item.id] = Math.max(0, item.qty - alreadyReturned);
    });
    return map;
  }, [bill.items, alreadyReturnedMap]);

  // Item 3: Filter items — items fully returned are HIDDEN (not greyed out)
  const returnableItems = useMemo(() => {
    return bill.items.filter((item) => (remainingMap[item.id] ?? item.qty) > 0);
  }, [bill.items, remainingMap]);

  // State: selected return quantities per item id
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
      const itemsToReturn = bill.items
        .filter((it) => (quantities[it.id] || 0) > 0)
        .map((it) => {
          const qty = quantities[it.id];
          const unitPrice = (it.lineTotal ?? it.price * it.qty) / it.qty;
          return {
            itemName: it.itemName,
            qty,
            amount: Number((unitPrice * qty).toFixed(2)),
            reason: reasons[it.id] || 'Customer return',
          };
        });

      if (itemsToReturn.length === 0) {
        throw new Error('Please select at least one item to return');
      }

      return returnsApi.createReturn(bill.id, { items: itemsToReturn });
    },
    onSuccess: () => {
      // Item 1: Cache invalidation requirements on return creation
      queryClient.invalidateQueries({ queryKey: ['bills', bill.id] });
      queryClient.invalidateQueries({ queryKey: ['bills', bill.id, 'returns'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'recent-bills'] });

      // Backwards compatibility
      queryClient.invalidateQueries({ queryKey: ['bill', bill.id] });
      queryClient.invalidateQueries({ queryKey: ['bill', bill.id, 'returns'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });

      toast.success('Return processed successfully!');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to process return';
      toast.error(msg);
    },
  });

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, delta: number) => {
    const maxQty = remainingMap[itemId] ?? 0;
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  // Running total of amount being returned
  const totalReturnAmount = bill.items.reduce((sum, item) => {
    const qty = quantities[item.id] || 0;
    const unitPrice = (item.lineTotal ?? item.price * item.qty) / item.qty;
    return sum + unitPrice * qty;
  }, 0);

  const totalItemsCount = Object.values(quantities).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Container: Bottom sheet on mobile, centered modal on desktop */}
      <div
        className="w-full sm:max-w-[560px] h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-card shadow-modal flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Return Items
            </h2>
            <p className="text-xs text-text-muted">
              Bill #{bill.billNumber} · Select quantities to return
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

        {/* Item List: Item 3 requires items fully returned to be HIDDEN */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 divide-y divide-border">
          {returnableItems.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-sm">
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                All items already returned
              </p>
              <p className="text-xs text-text-muted mt-1">
                There are no remaining items on this bill to return.
              </p>
            </div>
          ) : (
            returnableItems.map((item) => {
              const currentQty = quantities[item.id] || 0;
              const unitPrice = (item.lineTotal ?? item.price * item.qty) / item.qty;
              const alreadyReturned = alreadyReturnedMap[item.itemName.toLowerCase()] || 0;
              const remaining = remainingMap[item.id] ?? item.qty;

              return (
                <div key={item.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {item.itemName}
                      </p>
                      {/* Show original / already returned / remaining */}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-text-muted">
                          Purchased: {item.qty}
                        </span>
                        {alreadyReturned > 0 && (
                          <span className="text-xs text-warning font-medium">
                            · Already returned: {alreadyReturned}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-text-primary">
                          · Remaining: {remaining}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Unit price: <Money value={unitPrice} size="sm" />
                      </p>
                    </div>

                    {/* Quantity Stepper — bounded to remaining */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, -1)}
                        disabled={currentQty === 0}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, 1)}
                        disabled={currentQty >= remaining}
                        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Return amount preview + reason input */}
                  {currentQty > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Reason for return (optional)"
                        value={reasons[item.id] || ''}
                        onChange={(e) =>
                          setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        className="flex-1 text-xs px-3 py-1.5 border border-border rounded-input focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      />
                      <span className="text-xs font-bold text-danger shrink-0 self-end sm:self-center">
                        Refund: <Money value={unitPrice * currentQty} size="sm" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer — running total + confirm */}
        <div
          className="px-5 py-4 border-t border-border space-y-3"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-muted">
              Returning {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}:
            </span>
            <span className="text-base font-bold text-danger">
              <Money value={totalReturnAmount} />
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-xs font-semibold rounded-button hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={totalItemsCount === 0 || mutation.isPending}
              className="flex-1 py-2.5 bg-danger hover:bg-red-700 text-white rounded-button text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : null}
              <span>Confirm Return</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReturnSheet;
