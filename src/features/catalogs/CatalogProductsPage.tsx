import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { catalogRepository, CatalogProduct } from '../../lib/catalog/CatalogRepository';
import { PageHeader } from '../../components/PageHeader';
import { CatalogImage } from '../../components/CatalogImage';
import { Money } from '../../components/Money';
import { Plus, Package } from 'lucide-react';
import { clsx } from 'clsx';

interface CatalogProductsPageProps {
  onSelectProduct?: (product: CatalogProduct) => void;
  isPickerMode?: boolean;
}

export const CatalogProductsPage: React.FC<CatalogProductsPageProps> = ({
  onSelectProduct,
  isPickerMode = false,
}) => {
  const { catalogId, categoryId } = useParams<{ catalogId: string; categoryId: string }>();

  const { data: category, isLoading } = useQuery({
    queryKey: ['catalog-category', catalogId, categoryId],
    queryFn: () => catalogRepository.getCategory(catalogId!, categoryId!),
    enabled: !!catalogId && !!categoryId,
    staleTime: 5 * 60_000,
  });

  const handleSelect = (product: CatalogProduct) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={category?.name || 'Products'}
        subtitle="Select a product to add to your bill"
        showBack
        backTo={`/catalogs/${catalogId}`}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 skeleton-shimmer rounded-card" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(category?.products || []).map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className={clsx(
                'w-full flex items-center justify-between p-3.5 rounded-card border border-border transition-all duration-150',
                'hover:border-primary hover:shadow-sm active:scale-[0.99]',
                isPickerMode && 'cursor-pointer'
              )}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                  <CatalogImage
                    src={product.imageUrl}
                    alt={product.name}
                    fallbackIcon={<Package className="w-5 h-5 text-text-muted" />}
                    className="w-12 h-12 object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {product.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    GST {product.gstRate}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Money value={product.defaultPrice} size="md" className="font-bold text-primary" />
                  <p className="text-[11px] text-text-muted">default price</p>
                </div>
                {isPickerMode && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default CatalogProductsPage;
