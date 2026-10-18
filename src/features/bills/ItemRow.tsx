import React, { useState } from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Money } from '../../components/Money';

export interface BillItemFormState {
  id: string;
  itemName: string;
  qty: number;
  price: number;
  gstRate: number;
  discountPct: number;
  discountType?: 'Percentage' | 'Amount';
  discountValue?: number;
  productId?: string | null;
  sku?: string | null;
  unit?: string | null;
  catalogPrice?: number | null;
  availableStock?: number | null;
  addManually?: boolean;
  updatePrice?: boolean;
}

export interface ItemRowProps {
  item: BillItemFormState;
  index: number;
  canRemove: boolean;
  isStrictMode?: boolean;
  defaultDiscountMode?: 'Percentage' | 'Amount';
  onUpdate: (id: string, updates: Partial<BillItemFormState>) => void;
  onRemove: (id: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  canRemove,
  isStrictMode = false,
  defaultDiscountMode = 'Percentage',
  onUpdate,
  onRemove,
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const discountType = item.discountType || defaultDiscountMode;
  const discountValue = item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0);

  const lineSubtotal = (item.qty || 0) * (item.price || 0);
  let lineDiscount = 0;
  if (!isStrictMode) {
    if (discountType === 'Amount') {
      lineDiscount = Math.min(lineSubtotal, discountValue);
    } else {
      lineDiscount = (lineSubtotal * Math.min(100, discountValue)) / 100;
    }
  }
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  const handleQtyChange = (delta: number) => {
    const nextQty = Math.max(1, (item.qty || 1) + delta);
    onUpdate(item.id, { qty: nextQty });
  };

  const handlePriceChange = (val: string) => {
    const parsed = parseFloat(val);
    onUpdate(item.id, { price: isNaN(parsed) ? 0 : Math.max(0, parsed) });
  };

  return (
    <div
      className="p-2.5 sm:p-3.5 hover:bg-secondary/10 transition-colors"
      id={`item-row-${item.id}`}
      data-testid={`item-row-${index}`}
    >
      {/* Top: Name, Line Total & Remove */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
            placeholder="Item name"
            id={`item-name-${index}`}
            className="w-full font-bold text-sm sm:text-base text-text-primary bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Money value={lineTotal} className="font-bold text-sm sm:text-base text-text-primary" />
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              id={`remove-item-${item.id}`}
              className="p-1 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom: Price and Quantity Stepper */}
      <div className="flex items-center justify-between gap-2 mt-1.5 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Unit Price */}
          <div className="flex items-center gap-1 text-xs sm:text-sm text-text-muted">
            <span>₹</span>
            <input
              type="number"
              step="any"
              id={`item-price-${index}`}
              data-testid={`item-price-${index}`}
              value={item.price === 0 && !isEditingPrice ? '0' : item.price}
              onFocus={() => setIsEditingPrice(true)}
              onBlur={() => setIsEditingPrice(false)}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-16 sm:w-20 font-semibold text-text-primary bg-background border border-border/80 focus:border-primary rounded-lg px-1.5 py-0.5 text-xs sm:text-sm focus:outline-none"
              title="Tap to edit unit price"
            />
          </div>

          {/* Quantity Stepper */}
          <div className="inline-flex items-center border border-border rounded-lg bg-background overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => handleQtyChange(-1)}
              disabled={item.qty <= 1}
              id={`item-qty-dec-${index}`}
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-secondary/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className="w-7 sm:w-8 text-center font-bold text-xs sm:text-sm text-text-primary select-none"
              id={`item-qty-${index}`}
            >
              {item.qty}
            </span>
            <button
              type="button"
              onClick={() => handleQtyChange(1)}
              id={`item-qty-inc-${index}`}
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-secondary/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Available Stock Indicator */}
          {item.availableStock != null && (
            <span
              id={`item-stock-badge-${index}`}
              className={`text-[10px] sm:text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors ${
                (item.qty || 1) > item.availableStock
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                  : 'text-text-muted bg-secondary/30'
              }`}
              title={`Available Stock: ${item.availableStock}`}
            >
              {(item.qty || 1) > item.availableStock
                ? `Avail: ${item.availableStock}`
                : `Stock: ${item.availableStock}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
