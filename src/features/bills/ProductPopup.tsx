import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Folder, Edit3, Plus, Minus, Trash2, ArrowLeft, X, Sparkles } from 'lucide-react';
import { phase11Api, Product, ProductCategory } from '../../api/phase11';

export interface ProductPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: {
    id?: string;
    name: string;
    price: number;
    sku?: string;
    unit?: string;
    gstRate?: number;
    catalogPrice?: number;
    availableStock?: number;
    qty?: number;
  }) => void;
  onUpdateItemQty?: (identifier: { id?: string; name: string }, qty: number) => void;
  onRemoveItem?: (id: string) => void;
  currentItems?: Array<{ id: string; productId?: string | null; itemName: string; qty: number; price: number }>;
  recentProducts?: Product[];
  shopProductSource?: 'Store' | 'Generic' | 'Mix';
  effectiveShopGstRate?: number;
  stockMap?: Map<string, number>;
}

export const ProductPopup: React.FC<ProductPopupProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  onUpdateItemQty,
  onRemoveItem,
  currentItems = [],
  recentProducts = [],
  shopProductSource = 'Store',
  effectiveShopGstRate = 0,
  stockMap,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // View modes: 'search' | 'categories' | 'manual'
  const [viewMode, setViewMode] = useState<'search' | 'categories' | 'manual'>('search');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualError, setManualError] = useState('');

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic visualViewport tracking for mobile virtual keyboard
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    handleViewportChange();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isOpen]);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Reset when popup opens without auto-focusing search input
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults([]);
      setViewMode('search');
      setSelectedCategory(null);
      setManualName('');
      setManualPrice('');
      setManualQty('1');
      setManualError('');
    }
  }, [isOpen]);

  // Load categories if user opens category view
  useEffect(() => {
    if (viewMode === 'categories' && categories.length === 0) {
      setLoadingCategories(true);
      phase11Api.getCategories()
        .then((cats) => setCategories(cats))
        .catch(() => setCategories([]))
        .finally(() => setLoadingCategories(false));
    }
  }, [viewMode, categories.length]);

  // Load products for selected category
  useEffect(() => {
    if (selectedCategory) {
      phase11Api.getProducts({ category: selectedCategory })
        .then((prods) => setCategoryProducts(prods))
        .catch(() => setCategoryProducts([]));
    }
  }, [selectedCategory]);

  // Debounced search (250ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await phase11Api.searchProducts({
          query: trimmed,
          source: (shopProductSource.toLowerCase() as any) || 'mix',
          limit: 12,
        });
        setSearchResults(results);
      } catch {
        try {
          const prods = await phase11Api.getProducts({ search: trimmed });
          setSearchResults(prods);
        } catch {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, shopProductSource]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Default fallback recent items if none provided
  const defaultRecent = useMemo(() => {
    if (recentProducts && recentProducts.length > 0) return recentProducts;
    return [
      { id: 'prod-11', name: 'Shirt', sellingPrice: 1200, unit: 'Pcs', gstRate: 12 },
      { id: 'prod-12', name: 'Jeans', sellingPrice: 1800, unit: 'Pcs', gstRate: 12 },
      { id: 'prod-13', name: 'Shoes', sellingPrice: 2500, unit: 'Pair', gstRate: 18 },
      { id: 'prod-1', name: 'Basmati Rice 5kg', sellingPrice: 480, unit: 'Pack', gstRate: 5 },
      { id: 'prod-14', name: 'Tea', sellingPrice: 20, unit: 'Cup', gstRate: 5 },
      { id: 'prod-15', name: 'Chips', sellingPrice: 30, unit: 'Pack', gstRate: 12 },
      { id: 'prod-16', name: 'Chocolate', sellingPrice: 50, unit: 'Pcs', gstRate: 18 },
    ];
  }, [recentProducts]);

  if (!isOpen) return null;

  const handleAddItem = (prod: any, qty = 1) => {
    const stockQty = prod.id && stockMap ? stockMap.get(prod.id) : undefined;
    onAddProduct({
      id: prod.id,
      name: prod.name,
      price: prod.sellingPrice || prod.price || 0,
      sku: prod.sku,
      unit: prod.unit,
      gstRate: prod.gstRate ?? effectiveShopGstRate,
      catalogPrice: prod.sellingPrice || prod.price,
      availableStock: stockQty,
      qty,
    });
  };

  const handleSetQty = (prod: any, newQty: number) => {
    if (newQty <= 0) {
      if (onRemoveItem) {
        const match = currentItems?.find(
          (it) => (prod.id && it.productId === prod.id) || (it.itemName.toLowerCase() === prod.name.toLowerCase())
        );
        if (match) {
          onRemoveItem(match.id);
        }
      } else if (onUpdateItemQty) {
        onUpdateItemQty(prod, 0);
      }
    } else {
      if (onUpdateItemQty) {
        onUpdateItemQty(prod, newQty);
      } else {
        handleAddItem(prod, newQty);
      }
    }
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setManualError('Product name is required');
      return;
    }
    const parsedPrice = parseFloat(manualPrice) || 0;
    if (parsedPrice < 0) {
      setManualError('Price cannot be negative');
      return;
    }
    const parsedQty = Math.max(1, parseInt(manualQty, 10) || 1);

    onAddProduct({
      name: manualName.trim(),
      price: parsedPrice,
      qty: parsedQty,
      gstRate: effectiveShopGstRate,
    });

    setManualName('');
    setManualPrice('');
    setManualQty('1');
    setManualError('');
    setViewMode('search');
  };

  const renderProductItem = (prod: any) => {
    const existingItem = currentItems?.find(
      (it) => (prod.id && it.productId === prod.id) || (it.itemName.toLowerCase() === prod.name.toLowerCase())
    );
    const currentQty = existingItem ? existingItem.qty : 0;
    const isSelected = currentQty > 0;
    const price = prod.sellingPrice ?? prod.price ?? 0;
    const safeKey = prod.id || prod.name;
    const slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const stockQty = prod.id && stockMap ? stockMap.get(prod.id) : undefined;

    return (
      <div
        key={safeKey}
        data-testid={`product-row-${slug}`}
        onClick={() => {
          if (!isSelected) {
            handleAddItem(prod, 1);
          }
        }}
        className={`py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
          isSelected
            ? 'bg-primary/10 border border-primary/30 shadow-xs'
            : 'hover:bg-secondary/25 active:bg-secondary/40 border border-transparent'
        }`}
      >
        <div className="min-w-0 flex-1 pr-3">
          <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
            <span>{prod.name}</span>
            {prod.source === 'generic' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-normal">
                Catalog
              </span>
            )}
          </div>
          <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary">₹{price}</span>
            {prod.unit && <span>· {prod.unit}</span>}
            {prod.category && <span>· {prod.category}</span>}
            {stockQty !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  stockQty <= 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {stockQty <= 0 ? 'Out of stock' : `${stockQty} in stock`}
              </span>
            )}
          </div>
        </div>

        {isSelected ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center border border-primary/40 rounded-xl bg-background overflow-hidden shadow-xs shrink-0"
          >
            <button
              type="button"
              onClick={() => handleSetQty(prod, currentQty - 1)}
              id={`btn-dec-product-${slug}`}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-danger hover:bg-secondary/30 transition-colors"
              title={currentQty === 1 ? 'Remove from bill' : 'Decrease quantity'}
            >
              {currentQty === 1 ? (
                <Trash2 className="w-3.5 h-3.5 text-danger" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="number"
              min="1"
              value={currentQty}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                handleSetQty(prod, isNaN(val) ? 1 : Math.max(0, val));
              }}
              id={`input-qty-product-${slug}`}
              className="w-8 text-center font-bold text-xs text-text-primary bg-transparent focus:outline-none"
              title="Edit quantity"
            />
            <button
              type="button"
              onClick={() => handleSetQty(prod, currentQty + 1)}
              id={`btn-inc-product-${slug}`}
              className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-primary hover:bg-secondary/30 transition-colors"
              title="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddItem(prod, 1);
            }}
            id={`btn-add-product-${slug}`}
            className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
            title="Add to bill"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-2 sm:p-4 overflow-y-auto"
      id="product-popup-backdrop"
      data-testid="product-popup-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full sm:max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col mt-1 sm:my-auto shrink-0 animate-in fade-in zoom-in-95 duration-150"
        style={{
          maxHeight: viewportHeight ? `${Math.min(viewportHeight - 16, 620)}px` : 'min(92dvh, 620px)',
          height: viewportHeight ? `${Math.min(viewportHeight - 16, 600)}px` : 'min(88dvh, 600px)',
        }}
        onClick={(e) => e.stopPropagation()}
        id="product-popup-modal"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 sm:py-4 flex items-center justify-between border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            {viewMode !== 'search' && (
              <button
                type="button"
                onClick={() => {
                  if (selectedCategory) {
                    setSelectedCategory(null);
                  } else {
                    setViewMode('search');
                  }
                }}
                className="p-1 -ml-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
                title="Back to search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              {viewMode === 'search'
                ? 'Add Items'
                : viewMode === 'categories'
                ? selectedCategory || 'Browse Categories'
                : 'Add Manually'}
            </h2>
            {currentItems.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 animate-in fade-in">
                {currentItems.length} {currentItems.length === 1 ? 'item' : 'items'} in bill
              </span>
            )}
          </div>

          {/* Top-Right Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              id="product-popup-done-btn"
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
            >
              Done
            </button>
            <button
              type="button"
              onClick={onClose}
              id="product-popup-close-btn"
              className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-secondary/30 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'search' && (
            <>
              {/* Search Bar */}
              <div className="p-4 pb-2 space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                    <Search className="w-5 h-5 text-text-muted" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    id="product-search-input"
                    data-testid="product-search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search product..."
                    className="w-full pl-11 pr-9 py-2.5 text-base sm:text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    autoComplete="off"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Action buttons: Browse Categories & Add Manually */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('categories')}
                    id="btn-browse-categories"
                    className="flex-1 py-2 px-3 bg-secondary/20 hover:bg-secondary/40 text-text-primary text-xs font-semibold rounded-xl border border-border flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5 text-text-muted" />
                    Browse Categories
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('manual')}
                    id="btn-add-manually"
                    className="flex-1 py-2 px-3 bg-secondary/20 hover:bg-secondary/40 text-text-primary text-xs font-semibold rounded-xl border border-border flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-text-muted" />
                    Add Manually
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/60 mx-4" />

              {/* Product List */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {query.trim().length >= 2 ? (
                  /* Search Results */
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider py-1.5 px-1">
                      <span>
                        {searchResults.length > 0
                          ? `Results (${searchResults.length})`
                          : isSearching
                          ? 'Searching...'
                          : 'No products found'}
                      </span>
                      {isSearching && (
                        <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    <div className="divide-y divide-border/40">
                      {searchResults.map(renderProductItem)}
                    </div>
                  </div>
                ) : (
                  /* Recently / Frequently Used */
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider py-1.5 px-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Recently used
                    </div>

                    <div className="divide-y divide-border/40">
                      {defaultRecent.map(renderProductItem)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {viewMode === 'categories' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!selectedCategory ? (
                /* Category Tree / List */
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Select a category
                  </p>
                  {loadingCategories ? (
                    <div className="py-8 text-center text-text-muted text-sm">Loading categories...</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.name)}
                          className="p-3 text-left bg-background hover:bg-secondary/30 rounded-xl border border-border transition-colors font-medium text-sm text-text-primary flex items-center justify-between group"
                        >
                          <span>{cat.name}</span>
                          <Folder className="w-4 h-4 text-text-muted group-hover:text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Category Products */
                <div className="space-y-2">
                  <div className="divide-y divide-border/40">
                    {categoryProducts.map(renderProductItem)}
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'manual' && (
            /* Add Manually View */
            <form onSubmit={handleAddManualItem} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Product Name
                </label>
                <input
                  type="text"
                  id="manual-item-name"
                  value={manualName}
                  onChange={(e) => {
                    setManualName(e.target.value);
                    setManualError('');
                  }}
                  placeholder="e.g. Handmade Silk Scarf"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  id="manual-item-price"
                  value={manualPrice}
                  onChange={(e) => {
                    setManualPrice(e.target.value);
                    setManualError('');
                  }}
                  placeholder="e.g. 1200"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  id="manual-item-qty"
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 text-sm bg-background border border-border focus:border-primary rounded-xl text-text-primary placeholder:text-text-muted/60 focus:outline-none font-semibold"
                />
              </div>

              {manualError && (
                <p className="text-xs text-danger font-medium">{manualError}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  id="add-manual-item-to-bill-btn"
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add to Bill
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-5 py-3 border-t border-border/50 bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-text-muted" id="product-popup-footer-count">
            {currentItems.length > 0 ? (
              <span>
                <strong className="text-text-primary text-sm font-bold">{currentItems.length}</strong> {currentItems.length === 1 ? 'item' : 'items'} in bill
              </span>
            ) : (
              <span>No items added yet</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            id="product-popup-bottom-done-btn"
            className="px-5 py-2 bg-primary hover:bg-primary-hover active:bg-primary-dark text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
