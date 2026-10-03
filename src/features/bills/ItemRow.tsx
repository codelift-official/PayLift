import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Money } from '../../components/Money';

export interface BillItemFormState {
  id: string;
  itemName: string;
  qty: number;
  price: number;
  gstRate: number;
  discountPct: number;
}

export interface ItemRowProps {
  item: BillItemFormState;
  index: number;
  canRemove: boolean;
  isStrictMode: boolean;
  onUpdate: (id: string, updates: Partial<BillItemFormState>) => void;
  onRemove: (id: string) => void;
  autoFocus?: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  canRemove,
  isStrictMode,
  onUpdate,
  onRemove,
  autoFocus = false,
}) => {
  const lineSubtotal = (item.qty || 0) * (item.price || 0);
  const lineDiscount = lineSubtotal * ((item.discountPct || 0) / 100);
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  const handleQtyChange = (delta: number) => {
    const nextQty = Math.max(1, (item.qty || 1) + delta);
    onUpdate(item.id, { qty: nextQty });
  };

  return (
    <div className="bg-white border border-border rounded-button p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={item.itemName}
            autoFocus={autoFocus}
            onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
            placeholder={`Item ${index + 1} name (e.g. Cotton Shirt)`}
            className="w-full text-sm font-semibold text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-primary py-1"
          />
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center pt-1 border-t border-border text-xs">
        {/* Qty Stepper */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Quantity</label>
          <div className="flex items-center border border-border rounded-button w-fit" style={{ backgroundColor: 'var(--bg-app)' }}>
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              className="p-1.5 text-text-muted hover:text-text-primary active:bg-slate-200 dark:active:bg-slate-700 rounded-l"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={item.qty || 1}
              onChange={(e) => onUpdate(item.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-10 text-center font-bold text-text-primary bg-transparent focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              className="p-1.5 text-text-muted hover:text-text-primary active:bg-slate-200 dark:active:bg-slate-700 rounded-r"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Price (₹)</label>
          <input
            type="number"
            inputMode="numeric"
            value={item.price === 0 ? '' : item.price}
            onChange={(e) => onUpdate(item.id, { price: Math.max(0, parseFloat(e.target.value) || 0) })}
            placeholder="0.00"
            className="w-full px-2.5 py-1.5 border border-border rounded-button text-sm font-semibold text-text-primary focus:border-primary focus:outline-none"
            style={{ backgroundColor: 'var(--bg-input)' }}
          />
        </div>

        {/* GST Rate */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">GST %</label>
          <select
            value={item.gstRate}
            onChange={(e) => onUpdate(item.id, { gstRate: parseFloat(e.target.value) })}
            className="w-full px-2 py-1.5 border border-border rounded-button text-xs font-medium text-text-primary focus:border-primary focus:outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={12}>12%</option>
            <option value={18}>18%</option>
          </select>
        </div>

        {/* Discount % (hidden if strict mode) */}
        {!isStrictMode ? (
          <div>
            <label className="block text-[11px] font-medium text-text-muted mb-1">Disc %</label>
            <input
              type="number"
              inputMode="numeric"
              value={item.discountPct === 0 ? '' : item.discountPct}
              onChange={(e) =>
                onUpdate(item.id, {
                  discountPct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                })
              }
              placeholder="0"
              className="w-full px-2.5 py-1.5 border border-border rounded-button text-sm text-text-primary focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)' }}
            />
          </div>
        ) : (
          <div className="flex flex-col justify-end">
            <span className="text-[11px] text-text-muted mb-1">Line Total</span>
            <div className="text-sm font-bold text-text-primary">
              <Money value={lineTotal} size="sm" />
            </div>
          </div>
        )}
      </div>

      {!isStrictMode && (
        <div className="flex justify-between items-center text-xs pt-1 border-t border-border text-text-muted">
          <span>Item Total</span>
          <Money value={lineTotal} size="sm" className="font-bold text-text-primary" />
        </div>
      )}
    </div>
  );
};
