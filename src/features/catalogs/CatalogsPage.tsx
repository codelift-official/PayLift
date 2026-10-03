import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { catalogRepository } from '../../lib/catalog/CatalogRepository';
import { PageHeader } from '../../components/PageHeader';
import { CatalogImage } from '../../components/CatalogImage';
import {
  Shirt, Cookie, ShoppingBasket, Smartphone, Sparkles,
  Search, X,
} from 'lucide-react';

const CATALOG_ICONS: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  Shirt, Cookie, ShoppingBasket, Smartphone, Sparkles,
};

const CatalogIcon: React.FC<{ name: string; className?: string; style?: React.CSSProperties }> = ({ name, className = 'w-6 h-6', style }) => {
  const Icon = CATALOG_ICONS[name] || Sparkles;
  return <Icon className={className} style={style} />;
};

const CATALOG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  clothing: { bg: '#FFF0F0', text: '#E53935', border: '#FECACA' },
  bakery: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  grocery: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  electronics: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  cosmetics: { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
};

export const CatalogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const handleSearchChange = (term: string) => {
    const next = new URLSearchParams(searchParams);
    if (term) next.set('search', term);
    else next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const { data: catalogs, isLoading } = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => catalogRepository.getCatalogs(),
    staleTime: 5 * 60_000,
  });

  const filteredCatalogs = (catalogs || []).filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.categories.some((cat) => cat.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Catalogs"
        subtitle="Browse product categories to add items to bills"
      />

      {/* Search & Active Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search catalogs or categories..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-border rounded-input text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dismissible Filter Chips */}
        {searchQuery && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted">Active:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Query: {searchQuery}
              <button
                type="button"
                onClick={clearSearch}
                className="hover:text-primary-hover focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 skeleton-shimmer rounded-card" />
          ))}
        </div>
      ) : filteredCatalogs.length === 0 ? (
        <div
          className="p-8 text-center rounded-card border border-border"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            No catalogs match "{searchQuery}"
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredCatalogs.map((catalog) => {
            const colors = CATALOG_COLORS[catalog.id] || { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' };
            return (
              <button
                key={catalog.id}
                type="button"
                onClick={() => navigate(`/catalogs/${catalog.id}`)}
                className="group flex flex-col items-center p-3.5 rounded-card border text-center transition-all duration-150 active:scale-95 hover:shadow-raised overflow-hidden"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                }}
              >
                {/* Catalog Image with fallback */}
                <div className="w-16 h-16 rounded-xl overflow-hidden mb-2.5 shadow-sm group-hover:scale-105 transition-transform duration-150 flex items-center justify-center bg-white/40">
                  <CatalogImage
                    src={catalog.imageUrl}
                    alt={catalog.name}
                    fallbackIcon={
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.text + '20' }}
                      >
                        <CatalogIcon name={catalog.icon} className="w-6 h-6" style={{ color: colors.text } as any} />
                      </div>
                    }
                    className="w-16 h-16 object-cover"
                  />
                </div>
                <p className="text-sm font-bold truncate max-w-full" style={{ color: colors.text }}>
                  {catalog.name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: colors.text + 'CC' }}>
                  {catalog.categories.length} categories
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CatalogsPage;
