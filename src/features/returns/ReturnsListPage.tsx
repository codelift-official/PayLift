import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { returnsApi } from '../../api/returns';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Money } from '../../components/Money';
import { formatDate } from '../../lib/format';
import {
  Search,
  Undo2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ReturnsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialType = searchParams.get('type') || 'All';
  const [filterType, setFilterType] = useState<'All' | 'Return' | 'Exchange'>(
    (['Return', 'Exchange'].includes(initialType) ? initialType : 'All') as any
  );
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const updateUrlParams = (newType: string, newSearch: string) => {
    const next = new URLSearchParams(searchParams);
    if (newType && newType !== 'All') next.set('type', newType);
    else next.delete('type');

    if (newSearch) next.set('search', newSearch);
    else next.delete('search');

    setSearchParams(next, { replace: true });
  };

  const handleTypeChange = (type: 'All' | 'Return' | 'Exchange') => {
    setFilterType(type);
    setPage(1);
    updateUrlParams(type, searchTerm);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
    updateUrlParams(filterType, val);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['returns', { page, pageSize, search: searchTerm, type: filterType }],
    queryFn: () =>
      returnsApi.getReturns({
        page,
        pageSize,
        search: searchTerm || undefined,
        type: filterType === 'All' ? undefined : filterType,
      }),
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="Returns & Exchanges"
        subtitle="Manage returned merchandise and customer exchanges"
      />

      {/* Filter and Search Bar */}
      <Card
        className="border-border shadow-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by bill #, item, or reason..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-input text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
          {(['All', 'Return', 'Exchange'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150',
                filterType === type
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      {/* Item 4: Active Dismissible Filter Chips */}
      {(filterType !== 'All' || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-text-muted font-medium">Active:</span>
          {filterType !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              Type: {filterType}
              <button
                type="button"
                onClick={() => handleTypeChange('All')}
                className="hover:text-primary-hover focus:outline-none p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              Search: {searchTerm}
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="hover:text-primary-hover focus:outline-none p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton-shimmer rounded-card" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && data && data.items.length === 0 && (
        <Card className="p-12 text-center border-border shadow-card" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-text-muted flex items-center justify-center mx-auto mb-3">
            <Undo2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No Returns Found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchTerm || filterType !== 'All'
              ? 'No returns matching your search criteria.'
              : 'Returns and exchanges processed against bills will appear here.'}
          </p>
        </Card>
      )}

      {/* Returns List */}
      {!isLoading && data && data.items.length > 0 && (
        <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="divide-y divide-border">
            {data.items.map((item) => {
              const isExchange = item.tags.includes('Exchange');
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        isExchange
                          ? 'bg-amber-50 dark:bg-amber-950 text-warning'
                          : 'bg-red-50 dark:bg-red-950 text-danger'
                      )}
                    >
                      {isExchange ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Undo2 className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {item.displayID}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                            isExchange
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-danger dark:bg-red-950 dark:text-red-300'
                          )}
                        >
                          {item.statusBadge}
                        </span>
                      </div>
                      <p className="text-sm font-semibold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {item.primaryText}
                      </p>
                      {item.secondaryText && (
                        <p className="text-xs text-text-muted truncate">
                          {item.secondaryText}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={clsx('font-bold', isExchange ? 'text-text-primary' : 'text-danger')}>
                      <Money value={item.amount} size="md" negative={!isExchange} />
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {data.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>
                Page {data.page} of {data.totalPages} ({data.totalCount} total)
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPrev}
                  className="p-1.5 border border-border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasNext}
                  className="p-1.5 border border-border rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
export default ReturnsListPage;
