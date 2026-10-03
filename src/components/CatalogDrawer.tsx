import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronRight, ChevronLeft, Search, Layers, Package, AlertCircle } from 'lucide-react';
import {
  catalogRepository,
  Catalog,
  CatalogCategory,
  CatalogProduct,
} from '../lib/catalog/CatalogRepository';
import { CatalogImage } from './CatalogImage';
import { Money } from './Money';
import { getEnabledCatalogIds } from '../lib/catalog/enabledCatalogs';
import { useAuthStore } from '../stores/auth.store';

interface CatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: CatalogProduct) => void;
}

type DrawerLevel = 'catalogs' | 'categories' | 'products';

export const CatalogDrawer: React.FC<CatalogDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { user } = useAuthStore();
  const tenantId = user?.tenantID || 1;

  const [level, setLevel] = useState<DrawerLevel>('catalogs');
  const [selectedCatalog, setSelectedCatalog] = useState<Catalog | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [enabledCatalogIds, setEnabledCatalogIds] = useState<string[]>(() =>
    getEnabledCatalogIds(tenantId)
  );

  // Sync enabled catalogs when drawer opens or on custom event
  useEffect(() => {
    if (isOpen) {
      setEnabledCatalogIds(getEnabledCatalogIds(tenantId));
    }
  }, [isOpen, tenantId]);

  const { data: allCatalogs, isLoading: catalogsLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => catalogRepository.getCatalogs(),
    staleTime: 5 * 60_000,
    enabled: isOpen,
  });

  // Filter only enabled catalogs in order
  const catalogs = useMemo(() => {
    if (!allCatalogs) return [];
    return allCatalogs.filter((c) => enabledCatalogIds.includes(c.id));
  }, [allCatalogs, enabledCatalogIds]);

  // Handle single enabled catalog auto-skipping
  useEffect(() => {
    if (isOpen && catalogs.length === 1 && level === 'catalogs') {
      setSelectedCatalog(catalogs[0]);
      setLevel('categories');
    }
  }, [isOpen, catalogs, level]);

  // Search across enabled catalogs only
  const { data: allSearchResults } = useQuery({
    queryKey: ['catalog-search', searchQuery],
    queryFn: () => catalogRepository.searchProducts(searchQuery),
    enabled: !!searchQuery && searchQuery.length >= 2,
    staleTime: 60_000,
  });

  const searchResults = useMemo(() => {
    if (!allSearchResults) return [];
    return allSearchResults.filter((p) => {
      // Find matching catalog for product
      const cat = catalogs.find((c) => c.name.toLowerCase() === p.catalogName.toLowerCase());
      return !!cat;
    });
  }, [allSearchResults, catalogs]);

  const handleSelectCatalog = (catalog: Catalog) => {
    setSelectedCatalog(catalog);
    setLevel('categories');
  };

  const handleSelectCategory = (category: CatalogCategory) => {
    setSelectedCategory(category);
    setLevel('products');
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    onSelectProduct(product);
    onClose();
    // Reset state
    if (catalogs.length === 1) {
      setLevel('categories');
      setSelectedCatalog(catalogs[0]);
    } else {
      setLevel('catalogs');
      setSelectedCatalog(null);
    }
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const goBack = () => {
    if (level === 'products') {
      setLevel('categories');
      setSelectedCategory(null);
    } else if (level === 'categories') {
      if (catalogs.length === 1) {
        onClose();
      } else {
        setLevel('catalogs');
        setSelectedCatalog(null);
      }
    }
  };

  const getBreadcrumb = () => {
    if (level === 'catalogs') return 'Select Catalog';
    if (level === 'categories') return selectedCatalog?.name || 'Categories';
    if (level === 'products') return selectedCategory?.name || 'Products';
    return 'Browse Catalog';
  };

  if (!isOpen) return null;

  const showSearch = level === 'catalogs' || (level === 'categories' && catalogs.length === 1);
  const canGoBack = level !== 'catalogs' && !(level === 'categories' && catalogs.length === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full sm:max-w-[500px] h-[85vh] sm:h-[75vh] rounded-t-2xl sm:rounded-card shadow-modal flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        {/* Header - Item 8: "Add Item from Catalog" */}
        <div
          className="px-4 py-3 border-b border-border flex items-center gap-3"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-xs text-text-muted font-medium">Add Item from Catalog</p>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {getBreadcrumb()}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search (searches across enabled catalogs) */}
        {showSearch && catalogs.length > 0 && (
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search products across enabled catalogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-button focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {catalogsLoading ? (
            <div className="p-4 space-y-3">
              <div className="h-16 skeleton-shimmer rounded-card" />
              <div className="h-16 skeleton-shimmer rounded-card" />
              <div className="h-16 skeleton-shimmer rounded-card" />
            </div>
          ) : catalogs.length === 0 ? (
            /* Item 8: No catalogs enabled state */
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-warning flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                No catalogs enabled
              </p>
              <p className="text-xs text-text-muted mt-1 max-w-xs">
                No catalogs enabled. Ask your admin to configure catalogs.
              </p>
            </div>
          ) : showSearch && searchQuery.length >= 2 ? (
            /* Search Results across enabled catalogs */
            <div className="p-2 space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-center py-8 text-text-muted text-sm">
                  No matching products found in enabled catalogs
                </p>
              ) : (
                searchResults.map((product: CatalogProduct & { catalogName: string; categoryName: string }) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center justify-between p-3 rounded-button hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <CatalogImage
                          src={product.imageUrl}
                          alt={product.name}
                          fallbackIcon={<Package className="w-4 h-4 text-text-muted" />}
                          className="w-10 h-10 object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {product.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {product.catalogName} · {product.categoryName} · GST {product.gstRate}%
                        </p>
                      </div>
                    </div>
                    <Money value={product.defaultPrice} size="sm" className="font-bold text-primary ml-3 shrink-0" />
                  </button>
                ))
              )}
            </div>
          ) : level === 'catalogs' ? (
            /* Catalog Level: Flat list with Images */
            <div className="p-3 grid grid-cols-2 gap-2.5">
              {catalogs.map((catalog: Catalog) => (
                <button
                  key={catalog.id}
                  type="button"
                  onClick={() => handleSelectCatalog(catalog)}
                  className="flex flex-col items-start p-3 rounded-card border border-border hover:border-primary hover:shadow-sm transition-all active:scale-[0.98] text-left overflow-hidden group"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CatalogImage
                      src={catalog.imageUrl}
                      alt={catalog.name}
                      fallbackIcon={<Layers className="w-6 h-6 text-text-muted" />}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                    />
                  </div>
                  <p className="text-sm font-bold truncate max-w-full" style={{ color: 'var(--text-primary)' }}>
                    {catalog.name}
                  </p>
                  <p className="text-[11px] text-text-muted">{catalog.categories.length} categories</p>
                </button>
              ))}
            </div>
          ) : level === 'categories' && selectedCatalog ? (
            /* Category Level: List with Images */
            <div className="p-3 grid grid-cols-2 gap-2.5">
              {selectedCatalog.categories.map((category: CatalogCategory) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelectCategory(category)}
                  className="flex flex-col items-start p-3 rounded-card border border-border hover:border-primary hover:shadow-sm transition-all active:scale-[0.98] text-left overflow-hidden group"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <CatalogImage
                      src={category.imageUrl}
                      alt={category.name}
                      fallbackIcon={<Layers className="w-6 h-6 text-text-muted" />}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                    />
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                      {category.name}
                    </p>
                    <ChevronRight className="w-4 h-4 text-text-muted shrink-0 ml-1" />
                  </div>
                  <p className="text-[11px] text-text-muted">{category.products.length} products</p>
                </button>
              ))}
            </div>
          ) : level === 'products' && selectedCategory ? (
            /* Product Level: List with Images */
            <div className="p-2 space-y-1">
              {selectedCategory.products.map((product: CatalogProduct) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className="w-full flex items-center justify-between p-3 rounded-button hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <CatalogImage
                        src={product.imageUrl}
                        alt={product.name}
                        fallbackIcon={<Package className="w-4 h-4 text-text-muted" />}
                        className="w-10 h-10 object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {product.name}
                      </p>
                      <p className="text-xs text-text-muted">GST {product.gstRate}%</p>
                    </div>
                  </div>
                  <Money value={product.defaultPrice} size="sm" className="font-bold text-primary ml-3 shrink-0" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default CatalogDrawer;
