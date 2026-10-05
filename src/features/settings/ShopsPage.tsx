import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { Store, ChevronRight, MapPin, Phone, Plus, Loader2 } from 'lucide-react';

export const ShopsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = !user?.role || user.role === 'BusinessAdmin';

  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
    staleTime: 60_000,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 sm:pb-6">
      <PageHeader
        title="Shops"
        subtitle="Manage your store locations"
        showBack
        backTo="/settings"
        actions={
          isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/settings/shops/new')}
              className="hidden sm:inline-flex"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Shop
            </Button>
          ) : undefined
        }
      />

      {/* Shop list card */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Section header */}
        <div
          className="px-5 py-3 border-b border-border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center" style={{ color: 'var(--text-muted)' }}>
            <Store className="w-3.5 h-3.5 mr-1.5" />
            All Shops
          </h3>
          {shops && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {shops.length} {shops.length === 1 ? 'location' : 'locations'}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && shops && shops.length === 0 && (
          <div className="p-10 flex flex-col items-center text-center">
            <Store className="w-10 h-10 mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              No shops yet
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Add your first shop to start billing.
            </p>
            {isAdmin && (
              <Button variant="primary" size="sm" onClick={() => navigate('/settings/shops/new')}>
                <Plus className="w-4 h-4 mr-1.5" /> Create Shop
              </Button>
            )}
          </div>
        )}

        {/* Shop rows */}
        {!isLoading && shops && shops.length > 0 && (
          <div className="divide-y divide-border">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                to={`/settings/shops/${shop.id}`}
                className="flex items-center justify-between px-5 py-4 group transition-colors"
                style={{ color: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'var(--bg-border)' }}
                  >
                    <Store className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {shop.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {shop.address && (
                        <span className="text-xs flex items-center gap-1 truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
                          <MapPin className="w-3 h-3 shrink-0" />
                          {shop.address}
                        </span>
                      )}
                      {shop.mobile && (
                        <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
                          <Phone className="w-3 h-3" />
                          {shop.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Mobile "+ New Shop" button */}
      {isAdmin && (
        <div className="sm:hidden">
          <Button
            variant="primary"
            size="md"
            className="w-full py-3"
            onClick={() => navigate('/settings/shops/new')}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Shop
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
