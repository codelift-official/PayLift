import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Minus, BookOpen, Lock, Unlock, Search } from 'lucide-react';
import { Money } from '../../components/Money';
import { phase11Api, Product } from '../../api/phase11';

export interface BillItemFormState {
  id: string;
  itemName: string;
  qty: number;
  price: number;
  gstRate: number;
  discountPct: number;
  // Phase 11 fields:
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
  isStrictMode: boolean;
  inventoryModeEnabled?: boolean;
  strictStockMode?: boolean;
  shopId?: string;
  onUpdate: (id: string, updates: Partial<BillItemFormState>) => void;
  onRemove: (id: string) => void;
  onBrowseCatalog?: () => void;
  autoFocus?: boolean;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  index,
  canRemove,
  isStrictMode,
  inventoryModeEnabled = false,
  strictStockMode = false,
  shopId,
  onUpdate,
  onRemove,
  onBrowseCatalog,
  autoFocus = false,
}) => {
  const lineSubtotal = (item.qty || 0) * (item.price || 0);
  const lineDiscount = lineSubtotal * ((item.discountPct || 0) / 100);
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  // Search state for inventory hydrated search
  const [searchQuery, setSearchQuery] = useState(item.itemName || '');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hydrated search: type 2+ chars -> fetch top 10 matching products
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!item.addManually) {
      onUpdate(item.id, { itemName: val });
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const products = await phase11Api.getProducts({ search: val.trim() });
        setSearchResults(products.slice(0, 10));
        setDropdownOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setDropdownOpen(false);
    }
  };

  const handleSelectProduct = async (product: Product) => {
    let available: number | null = null;
    try {
      const stock = await phase11Api.getStock({ shopId });
      const foundStock = stock.find((s) => s.productId === product.id);
      if (foundStock) {
        available = foundStock.quantity;
      }
    } catch {
      // ignore
    }

    onUpdate(item.id, {
      productId: product.id,
      itemName: product.name,
      sku: product.sku,
      unit: product.unit,
      price: product.sellingPrice,
      catalogPrice: product.sellingPrice,
      gstRate: product.gstRate,
      availableStock: available ?? 10,
      addManually: false,
      updatePrice: false,
    });
    setSearchQuery(product.name);
    setDropdownOpen(false);
  };

  const handleToggleAddManually = (checked: boolean) => {
    onUpdate(item.id, {
      addManually: checked,
      productId: checked ? null : item.productId,
      catalogPrice: checked ? null : item.catalogPrice,
      availableStock: checked ? null : item.availableStock,
      updatePrice: checked ? true : item.updatePrice,
    });
  };

  const handleToggleUpdatePrice = (checked: boolean) => {
    onUpdate(item.id, { updatePrice: checked });
  };

  const unitNormalized = (item.unit || '').trim().toLowerCase();
  const isDecimalUnit = ['kg', 'g', 'ltr', 'ml'].includes(unitNormalized);

  const handleQtyChange = (delta: number) => {
    const current = Number(item.qty) || 0;
    const minStep = isDecimalUnit ? 0.001 : 1;
    let nextQty = Math.round((current + delta) * 1000) / 1000;
    if (nextQty < minStep) nextQty = minStep;
    if (nextQty > 99999.999) nextQty = 99999.999;
    if (strictStockMode && item.availableStock !== undefined && item.availableStock !== null) {
      if (nextQty > item.availableStock) {
        nextQty = item.availableStock;
      }
    }
    onUpdate(item.id, { qty: nextQty });
  };

  const isPriceOverridden =
    item.catalogPrice !== undefined &&
    item.catalogPrice !== null &&
    item.price !== item.catalogPrice;

  const showAvailable =
    strictStockMode ||
    (inventoryModeEnabled && item.availableStock !== undefined && item.availableStock !== null);

  // ── RENDER MODE A: INVENTORY MODE ENABLED ─────────────────────────
  if (inventoryModeEnabled) {
    return (
      <div
        className="bg-card border border-border rounded-button p-3 sm:p-4 shadow-sm space-y-3 item-row-container"
        id={`item-row-${item.id}`}
      >
        {/* Header: Item # and Delete */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-primary">
            Item {index + 1}
          </span>
          {canRemove && (
            <button
              type="button"
              id={`remove-item-${item.id}`}
              onClick={() => onRemove(item.id)}
              className="p-1 text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product Search or Manual Name Input */}
        <div className="relative" ref={searchContainerRef}>
          {item.addManually ? (
            <input
              type="text"
              id={`item-manual-name-${index}`}
              data-testid={`item-manual-name-${index}`}
              value={item.itemName}
              onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
              placeholder="Enter product name manually..."
              className="w-full px-3 py-2 text-sm border border-border rounded-button text-text-primary focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)' }}
              autoFocus={autoFocus}
            />
          ) : (
            <div className="relative">
              <input
                type="text"
                id={`item-search-${index}`}
                data-testid={`item-search-${index}`}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setDropdownOpen(true);
                }}
                placeholder="Search product..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-button text-text-primary focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)' }}
                autoFocus={autoFocus}
              />
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5 pointer-events-none" />

              {/* Suggestions Dropdown */}
              {dropdownOpen && (
                <div
                  id={`search-dropdown-${index}`}
                  data-testid={`search-dropdown-${index}`}
                  className="absolute left-0 right-0 mt-1 max-h-56 overflow-auto rounded-lg shadow-xl border border-border z-30 divide-y divide-border animate-in fade-in zoom-in-95 duration-100"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-primary-soft hover:text-primary transition-colors flex items-center justify-between product-suggestion-item"
                    >
                      <div>
                        <span className="font-bold block text-text-primary">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-text-muted">
                          SKU: {prod.sku || '—'} • {prod.category}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-text-primary">
                        ₹{prod.sellingPrice}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkboxes: [ ] Add manually   [ ] Update price */}
        <div className="flex items-center gap-5 text-xs text-text-muted">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id={`item-add-manually-${index}`}
              data-testid={`item-add-manually-${index}`}
              checked={Boolean(item.addManually)}
              onChange={(e) => handleToggleAddManually(e.target.checked)}
              className="rounded border-border text-primary cursor-pointer w-3.5 h-3.5"
            />
            <span className="font-medium text-text-primary">Add manually</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id={`item-update-price-${index}`}
              data-testid={`item-update-price-${index}`}
              checked={Boolean(item.updatePrice)}
              onChange={(e) => handleToggleUpdatePrice(e.target.checked)}
              className="rounded border-border text-primary cursor-pointer w-3.5 h-3.5"
            />
            <span className="font-medium text-text-primary">Update price</span>
          </label>
        </div>

        {/* Qty [1] × Price [₹500 🔒] = ₹500 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            {/* Qty Controls */}
            <div className="flex items-center gap-1">
              {isDecimalUnit && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    title="-0.5"
                    onClick={() => handleQtyChange(-0.5)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    title="-0.1"
                    onClick={() => handleQtyChange(-0.1)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                  >
                    -0.1
                  </button>
                </div>
              )}
              <div className="flex items-center border border-border rounded-button" style={{ backgroundColor: 'var(--bg-app)' }}>
                <button
                  type="button"
                  onClick={() => handleQtyChange(isDecimalUnit ? -0.1 : -1)}
                  className="p-1 text-text-muted hover:text-text-primary"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  id={`qty-input-${item.id}`}
                  step={isDecimalUnit ? '0.001' : '1'}
                  min={isDecimalUnit ? '0.001' : '1'}
                  max={strictStockMode && item.availableStock ? item.availableStock : undefined}
                  value={item.qty ?? ''}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    let val = isNaN(parsed) ? 0 : parsed;
                    if (strictStockMode && item.availableStock !== undefined && item.availableStock !== null) {
                      if (val > item.availableStock) val = item.availableStock;
                    }
                    onUpdate(item.id, { qty: val });
                  }}
                  className={`${isDecimalUnit ? 'w-14' : 'w-10'} text-center font-bold text-text-primary bg-transparent focus:outline-none text-xs`}
                />
                <button
                  type="button"
                  onClick={() => handleQtyChange(isDecimalUnit ? 0.1 : 1)}
                  className="p-1 text-text-muted hover:text-text-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {isDecimalUnit && (
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    title="+0.1"
                    onClick={() => handleQtyChange(0.1)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                  >
                    +0.1
                  </button>
                  <button
                    type="button"
                    title="+0.5"
                    onClick={() => handleQtyChange(0.5)}
                    className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                  >
                    +0.5
                  </button>
                </div>
              )}
            </div>

            <span className="text-text-muted font-bold">×</span>

            {/* Price input (locked unless updatePrice checked) */}
            <div className="relative flex items-center">
              <span className="absolute left-2 text-text-muted font-semibold">₹</span>
              <input
                type="number"
                step="any"
                id={`item-price-${index}`}
                data-testid={`item-price-${index}`}
                readOnly={!item.updatePrice && !item.addManually}
                value={item.price === 0 ? '' : item.price}
                onChange={(e) =>
                  onUpdate(item.id, { price: Math.max(0, parseFloat(e.target.value) || 0) })
                }
                className={`w-24 pl-5 pr-7 py-1 text-xs font-bold rounded-button border ${
                  item.updatePrice || item.addManually
                    ? 'border-primary focus:outline-none'
                    : 'border-border bg-slate-100 dark:bg-slate-800 text-text-muted cursor-not-allowed'
                }`}
                style={{ backgroundColor: !item.updatePrice && !item.addManually ? undefined : 'var(--bg-input)' }}
              />
              <span className="absolute right-2 text-text-muted pointer-events-none">
                {item.updatePrice || item.addManually ? (
                  <Unlock className="w-3 h-3 text-primary" />
                ) : (
                  <Lock className="w-3 h-3 text-text-muted" />
                )}
              </span>
            </div>

            <span className="text-text-muted font-bold">=</span>

            {/* Subtotal */}
            <span className="font-bold text-text-primary text-sm">
              <Money value={lineTotal} size="sm" />
            </span>
          </div>

          {/* GST selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-muted">GST:</span>
            <select
              value={item.gstRate}
              onChange={(e) => onUpdate(item.id, { gstRate: parseFloat(e.target.value) })}
              className="px-2 py-1 border border-border rounded text-[11px] font-semibold"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value={0}>0%</option>
              <option value={5}>5%</option>
              <option value={12}>12%</option>
              <option value={18}>18%</option>
            </select>
          </div>
        </div>

        {/* Footer info: Available Stock & Overridden Hint */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          {showAvailable && (
            <span
              id={`item-available-stock-${index}`}
              data-testid={`item-available-stock-${index}`}
              className={`font-semibold available-stock-text ${
                item.availableStock !== undefined && item.availableStock !== null && item.availableStock <= 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-text-muted'
              }`}
            >
              Available: {item.availableStock ?? 0}
            </span>
          )}

          {isPriceOverridden && (
            <span
              id={`price-overridden-hint-${item.id}`}
              className="text-amber-600 dark:text-amber-400 font-semibold catalog-override-hint ml-auto"
            >
              Catalog: ₹{item.catalogPrice} (overridden)
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER MODE B: DEFAULT SIMPLE BILL ITEM ROW ───────────────────
  return (
    <div className="bg-card border border-border rounded-button p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={item.itemName}
            autoFocus={autoFocus}
            onChange={(e) => onUpdate(item.id, { itemName: e.target.value })}
            placeholder={`Item ${index + 1} name (e.g. Cotton Shirt)`}
            className="w-full text-sm font-semibold text-text-primary placeholder:text-text-muted focus:outline-none border-b border-transparent focus:border-primary py-1"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!item.itemName && onBrowseCatalog && (
            <button
              type="button"
              onClick={onBrowseCatalog}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 rounded-button transition-colors"
              title="Pick item from product catalog"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="p-1.5 rounded-button text-text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center pt-1 border-t border-border text-xs">
        {/* Qty Stepper */}
        <div>
          <label className="block text-[11px] font-medium text-text-muted mb-1">Quantity</label>
          <div className="flex items-center gap-1">
            {isDecimalUnit && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="-0.5"
                  onClick={() => handleQtyChange(-0.5)}
                  className="px-1.5 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                >
                  -0.5
                </button>
                <button
                  type="button"
                  title="-0.1"
                  onClick={() => handleQtyChange(-0.1)}
                  className="px-1.5 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                >
                  -0.1
                </button>
              </div>
            )}
            <div className="flex items-center border border-border rounded-button w-fit" style={{ backgroundColor: 'var(--bg-app)' }}>
              <button
                type="button"
                onClick={() => handleQtyChange(isDecimalUnit ? -0.1 : -1)}
                className="p-1.5 text-text-muted hover:text-text-primary active:bg-slate-200 dark:active:bg-slate-700 rounded-l"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                step={isDecimalUnit ? '0.001' : '1'}
                value={item.qty ?? ''}
                onChange={(e) => {
                  const parsed = parseFloat(e.target.value);
                  const val = isNaN(parsed) ? 0 : parsed;
                  onUpdate(item.id, { qty: val });
                }}
                className={`${isDecimalUnit ? 'w-16' : 'w-10'} text-center font-bold text-text-primary bg-transparent focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => handleQtyChange(isDecimalUnit ? 0.1 : 1)}
                className="p-1.5 text-text-muted hover:text-text-primary active:bg-slate-200 dark:active:bg-slate-700 rounded-r"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {isDecimalUnit && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  title="+0.1"
                  onClick={() => handleQtyChange(0.1)}
                  className="px-1.5 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                >
                  +0.1
                </button>
                <button
                  type="button"
                  title="+0.5"
                  onClick={() => handleQtyChange(0.5)}
                  className="px-1.5 py-1 text-[11px] font-semibold text-text-muted hover:text-text-primary border border-border rounded"
                >
                  +0.5
                </button>
              </div>
            )}
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
