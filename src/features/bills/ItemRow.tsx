import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Minus, BookOpen, Lock, Unlock, Search } from 'lucide-react';
import { Money } from '../../components/Money';
import { phase11Api } from '../../api/phase11';

export interface BillItemFormState {
  id: string;
  itemName: string;
  qty: number;
  price: number;
  gstRate: number;
  discountPct: number;
  discountType?: 'Percentage' | 'Amount';
  discountValue?: number;
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
  defaultDiscountMode?: 'Percentage' | 'Amount';
  productSource?: 'Store' | 'Generic' | 'Mix';
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
  defaultDiscountMode = 'Percentage',
  productSource = 'Store',
  onUpdate,
  onRemove,
  onBrowseCatalog,
  autoFocus = false,
}) => {
  const discountType = item.discountType || defaultDiscountMode || 'Percentage';
  const discountValue = item.discountValue !== undefined ? item.discountValue : (item.discountPct || 0);

  const lineSubtotal = (item.qty || 0) * (item.price || 0);
  let lineDiscount = 0;
  if (discountType === 'Amount') {
    lineDiscount = Math.min(lineSubtotal, discountValue);
  } else {
    lineDiscount = lineSubtotal * (Math.min(100, discountValue) / 100);
  }
  const lineTotal = Math.max(0, lineSubtotal - lineDiscount);

  // Search state for inventory hydrated search
  const [searchQuery, setSearchQuery] = useState(item.itemName || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchQuery(item.itemName || '');
  }, [item.itemName]);

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

  // Hydrated semantic search: type 2+ chars -> fetch top 10 matching products
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (!item.addManually) {
      onUpdate(item.id, { itemName: val });
    }

    if (val.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await phase11Api.searchProducts({
          query: val.trim(),
          source: (productSource?.toLowerCase() as any) || 'mix',
          limit: 10,
        });
        setSearchResults(results);
        setDropdownOpen(true);
        setFocusedIndex(-1);
      } catch {
        try {
          const prods = await phase11Api.getProducts({ search: val.trim() });
          setSearchResults(prods.slice(0, 10));
          setDropdownOpen(true);
          setFocusedIndex(-1);
        } catch {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && searchResults[focusedIndex]) {
        handleSelectProduct(searchResults[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const handleSelectProduct = async (product: any) => {
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
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setDropdownOpen(true);
                }}
                placeholder="Search product (by name, SKU, or Hindi/English synonym)..."
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
                  {searchResults.map((prod, pIdx) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between product-suggestion-item ${
                        pIdx === focusedIndex ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary' : 'hover:bg-primary-soft hover:text-primary'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text-primary truncate">
                            {prod.name}
                          </span>
                          {prod.source && (
                            <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold ${
                              prod.source === 'store' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              {prod.source}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5">
                          <span>SKU: {prod.sku || '—'}</span>
                          <span>•</span>
                          <span>{prod.category}</span>
                          {searchQuery && !prod.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                            <span className="text-primary italic font-medium">(matches "{searchQuery}")</span>
                          )}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-text-primary shrink-0">
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

        {/* Qty [1] × Price [₹500 🔒] - Disc = ₹500 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs">
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Item Discount in Mode A */}
            {!isStrictMode && (
              <div className="flex items-center gap-1 pl-2 border-l border-border">
                <span className="text-text-muted font-bold text-[10px]">Disc:</span>
                <input
                  type="number"
                  step="any"
                  id={`item-discount-${index}`}
                  data-testid={`item-discount-${index}`}
                  value={discountValue === 0 ? '' : discountValue}
                  placeholder="0"
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                    if (discountType === 'Percentage') {
                      const capped = Math.min(100, val);
                      onUpdate(item.id, { discountType: 'Percentage', discountValue: capped, discountPct: capped });
                    } else {
                      const capped = Math.min(lineSubtotal, val);
                      const pct = lineSubtotal > 0 ? (capped / lineSubtotal) * 100 : 0;
                      onUpdate(item.id, { discountType: 'Amount', discountValue: capped, discountPct: Math.round(pct * 100) / 100 });
                    }
                  }}
                  className="w-14 px-1.5 py-1 text-xs font-bold rounded-button border border-border focus:border-primary focus:outline-none"
                  style={{ backgroundColor: 'var(--bg-input)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const nextType = discountType === 'Percentage' ? 'Amount' : 'Percentage';
                    onUpdate(item.id, { discountType: nextType });
                  }}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded border border-border bg-muted hover:bg-muted/80 text-text-primary"
                  title={`Toggle between % and ₹`}
                >
                  {discountType === 'Percentage' ? '%' : '₹'}
                </button>
              </div>
            )}

            <span className="text-text-muted font-bold">=</span>

            {/* Subtotal / Line Total */}
            <div className="flex items-center gap-1.5">
              {lineDiscount > 0 && (
                <span className="line-through text-text-muted text-[11px]">
                  <Money value={lineSubtotal} size="sm" />
                </span>
              )}
              <span className="font-bold text-text-primary text-sm">
                <Money value={lineTotal} size="sm" />
              </span>
            </div>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center pt-1 border-t border-border text-xs">
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

        {/* Discount with % / ₹ toggle */}
        {!isStrictMode ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-text-muted">Discount</label>
              <button
                type="button"
                onClick={() => {
                  const nextType = discountType === 'Percentage' ? 'Amount' : 'Percentage';
                  onUpdate(item.id, { discountType: nextType });
                }}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-muted hover:bg-muted/80 text-text-primary"
                title={`Toggle between % and ₹`}
              >
                {discountType === 'Percentage' ? '%' : '₹'}
              </button>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={discountValue === 0 ? '' : discountValue}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                const val = isNaN(parsed) ? 0 : Math.max(0, parsed);
                if (discountType === 'Percentage') {
                  const capped = Math.min(100, val);
                  onUpdate(item.id, { discountType: 'Percentage', discountValue: capped, discountPct: capped });
                } else {
                  const capped = Math.min(lineSubtotal, val);
                  const pct = lineSubtotal > 0 ? (capped / lineSubtotal) * 100 : 0;
                  onUpdate(item.id, { discountType: 'Amount', discountValue: capped, discountPct: Math.round(pct * 100) / 100 });
                }
              }}
              placeholder={discountType === 'Percentage' ? '0%' : '₹0'}
              className="w-full px-2.5 py-1.5 border border-border rounded-button text-sm font-semibold text-text-primary focus:border-primary focus:outline-none"
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
          <div className="flex items-center gap-1.5">
            {lineDiscount > 0 && (
              <span className="line-through text-text-muted text-xs">
                <Money value={lineSubtotal} size="sm" />
              </span>
            )}
            <Money value={lineTotal} size="sm" className="font-bold text-text-primary" />
          </div>
        </div>
      )}
    </div>
  );
};
