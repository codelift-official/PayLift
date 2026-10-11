import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Minus, ChevronDown } from 'lucide-react';
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
  const [discountDropdownOpen, setDiscountDropdownOpen] = useState(false);
  const discountDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close discount dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (discountDropdownRef.current && !discountDropdownRef.current.contains(e.target as Node)) {
        setDiscountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleQtyChange = (delta: number) => {
    const nextQty = Math.max(1, (item.qty || 1) + delta);
    onUpdate(item.id, { qty: nextQty });
  };

  const handlePriceChange = (val: string) => {
    const parsed = parseFloat(val);
    onUpdate(item.id, { price: isNaN(parsed) ? 0 : Math.max(0, parsed) });
  };

  const handleSelectDiscountPct = (pct: number) => {
    onUpdate(item.id, {
      discountType: 'Percentage',
      discountValue: pct,
      discountPct: pct,
    });
    setDiscountDropdownOpen(false);
  };

  return (
    <div
      className="p-4 hover:bg-secondary/10 transition-colors"
      id={`item-row-${item.id}`}
      data-testid={`item-row-${index}`}
    >
      {/* Top: Name & Remove */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
            placeholder="Item name"
            id={`item-name-${index}`}
            className="w-full font-bold text-base text-text-primary bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 transition-all"
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            id={`remove-item-${item.id}`}
            className="p-1.5 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors -mr-1"
            title="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Middle: Price × Qty = Line Total */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-sm text-text-muted">
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
            className="w-20 font-semibold text-text-primary bg-background border border-border/80 focus:border-primary rounded-lg px-2 py-0.5 text-sm focus:outline-none"
            title="Tap to edit unit price"
          />
          <span className="text-text-muted">× {item.qty}</span>
        </div>

        <div className="text-right">
          <Money value={lineTotal} className="font-bold text-base text-text-primary" />
        </div>
      </div>

      {/* Bottom: Stepper [−] Qty [+] and Discount Dropdown [10% ▾] */}
      <div className="flex items-center justify-between mt-3 pt-1">
        {/* Quantity Stepper */}
        <div className="inline-flex items-center border border-border rounded-xl bg-background overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => handleQtyChange(-1)}
            disabled={item.qty <= 1}
            id={`item-qty-dec-${index}`}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-secondary/30 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span
            className="w-10 text-center font-bold text-sm text-text-primary select-none"
            id={`item-qty-${index}`}
          >
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => handleQtyChange(1)}
            id={`item-qty-inc-${index}`}
            className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-secondary/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Discount Selector [10% ▾] */}
        {!isStrictMode && (
          <div className="relative" ref={discountDropdownRef}>
            <button
              type="button"
              onClick={() => setDiscountDropdownOpen((prev) => !prev)}
              id={`item-discount-btn-${index}`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-secondary/20 text-text-primary shadow-sm transition-colors"
            >
              <span>{discountValue > 0 ? `${discountValue}%` : '0%'}</span>
              <ChevronDown className="w-3 h-3 text-text-muted" />
            </button>

            {discountDropdownOpen && (
              <div className="absolute right-0 bottom-full mb-1 z-20 w-32 bg-card border border-border rounded-xl shadow-lg p-1 space-y-0.5 animate-in fade-in zoom-in-95">
                {[0, 5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleSelectDiscountPct(pct)}
                    className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg text-left transition-colors flex items-center justify-between ${
                      discountValue === pct
                        ? 'bg-primary text-white font-bold'
                        : 'text-text-primary hover:bg-secondary/30'
                    }`}
                  >
                    <span>{pct === 0 ? 'No discount' : `${pct}% off`}</span>
                    {discountValue === pct && <span className="text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
