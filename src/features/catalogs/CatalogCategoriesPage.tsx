import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { catalogRepository } from '../../lib/catalog/CatalogRepository';
import { PageHeader } from '../../components/PageHeader';
import { CatalogImage } from '../../components/CatalogImage';
import { Sparkles } from 'lucide-react';

export const CatalogCategoriesPage: React.FC = () => {
  const { catalogId } = useParams<{ catalogId: string }>();
  const navigate = useNavigate();

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['catalog', catalogId],
    queryFn: () => catalogRepository.getCatalog(catalogId!),
    enabled: !!catalogId,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={catalog?.name || 'Categories'}
        subtitle={catalog?.description || 'Select a category to browse products'}
        showBack
        backTo="/catalogs"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {(catalog?.categories || []).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => navigate(`/catalogs/${catalogId}/categories/${category.id}`)}
              className="group flex flex-col items-start p-3.5 rounded-card border border-border transition-all duration-150 active:scale-95 hover:border-primary hover:shadow-raised overflow-hidden text-left"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="w-full h-24 rounded-lg overflow-hidden mb-2.5 bg-slate-100 flex items-center justify-center">
                <CatalogImage
                  src={category.imageUrl}
                  alt={category.name}
                  fallbackIcon={
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                  }
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
                />
              </div>
              <p className="text-sm font-bold truncate max-w-full" style={{ color: 'var(--text-primary)' }}>
                {category.name}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {category.products.length} products
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default CatalogCategoriesPage;
