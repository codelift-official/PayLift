import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Folder, Edit3, Plus, ArrowLeft, X, Sparkles } from 'lucide-react';
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
  }) => void;
  recentProducts?: Product[];
  shopProductSource?: 'Store' | 'Generic' | 'Mix';
  effectiveShopGstRate?: number;
}

export const ProductPopup: React.FC<ProductPopupProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  recentProducts = [],
  shopProductSource = 'Store',
  effectiveShopGstRate = 0,
}) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sessionAddedCount, setSessionAddedCount] = useState(0);

  // View modes: 'search' | 'categories' | 'manual'
  const [viewMode, setViewMode] = useState<'search' | 'categories' | 'manual'>('search');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualError, setManualError] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset and auto-focus when popup opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSearchResults([]);
      setViewMode('search');
      setSelectedCategory(null);
      setSessionAddedCount(0);
      setManualName('');
      setManualPrice('');
      setManualError('');
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
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

  const handleAddItem = (prod: any) => {
    onAddProduct({
      id: prod.id,
      name: prod.name,
      price: prod.sellingPrice || prod.price || 0,
      sku: prod.sku,
      unit: prod.unit,
      gstRate: prod.gstRate ?? effectiveShopGstRate,
      catalogPrice: prod.sellingPrice || prod.price,
    });
    setSessionAddedCount((prev) => prev + 1);
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

    onAddProduct({
      name: manualName.trim(),
      price: parsedPrice,
      gstRate: effectiveShopGstRate,
    });

    setSessionAddedCount((prev) => prev + 1);
    setManualName('');
    setManualPrice('');
    setManualError('');
    setViewMode('search');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4"
      onClick={onClose}
      id="product-popup-backdrop"
      data-testid="product-popup-backdrop"
    >
      <div
        className="w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[85vh] h-[640px]"
        onClick={(e) => e.stopPropagation()}
        id="product-popup-modal"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 pt-3 pb-3 sm:pt-5 flex items-center justify-between border-b border-border/50">
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
            {sessionAddedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 animate-in fade-in">
                {sessionAddedCount} {sessionAddedCount === 1 ? 'item' : 'items'} added
              </span>
            )}
          </div>

          {/* Top-Right [Done] Button */}
          <button
            type="button"
            onClick={onClose}
            id="product-popup-done-btn"
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            Done
          </button>
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
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id || prod.name}
                          onClick={() => handleAddItem(prod)}
                          className="py-3 px-3 rounded-xl flex items-center justify-between hover:bg-secondary/25 active:bg-secondary/40 transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors flex items-center gap-2">
                              <span>{prod.name}</span>
                              {prod.source === 'generic' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-normal">
                                  Catalog
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                              <span className="font-semibold text-text-primary">
                                ₹{prod.sellingPrice ?? prod.price ?? 0}
                              </span>
                              {prod.unit && <span>· {prod.unit}</span>}
                              {prod.category && <span>· {prod.category}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItem(prod);
                            }}
                            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all shrink-0 font-bold"
                            title="Add to bill"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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
                      {defaultRecent.map((prod) => (
                        <div
                          key={prod.id || prod.name}
                          onClick={() => handleAddItem(prod)}
                          className="py-3 px-3 rounded-xl flex items-center justify-between hover:bg-secondary/25 active:bg-secondary/40 transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">
                              {prod.name}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5 flex items-center gap-2">
                              <span className="font-semibold text-text-primary">
                                ₹{prod.sellingPrice ?? (prod as any).price ?? 0}
                              </span>
                              {prod.unit && <span>· {prod.unit}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddItem(prod);
                            }}
                            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all shrink-0 font-bold"
                            title="Add to bill"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
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
                    {categoryProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleAddItem(prod)}
                        className="py-3 px-3 rounded-xl flex items-center justify-between hover:bg-secondary/25 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-semibold text-sm text-text-primary group-hover:text-primary transition-colors">
                            {prod.name}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">
                            <span className="font-semibold text-text-primary">₹{prod.sellingPrice}</span>
                            {prod.unit && <span> · {prod.unit}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItem(prod);
                          }}
                          className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-all shrink-0 font-bold"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
      </div>
    </div>
  );
};
