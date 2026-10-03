import React from 'react';
import { useGrid } from '../../hooks/useGrid';
import { useResponsive } from '../../hooks/useResponsive';
import { SearchBar } from './SearchBar';
import { Pagination } from './Pagination';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { Money } from '../Money';
import { formatDate } from '../../lib/format';
import { clsx } from 'clsx';
import { Inbox } from 'lucide-react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataGridProps<T extends { id: string }> {
  queryKey: string[];
  endpoint: string;
  columns: ColumnDef<T>[];
  filters?: Record<string, unknown>;
  filterChips?: React.ReactNode;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  renderMobileRow?: (row: T) => React.ReactNode;
}

// A2: Desktop skeleton — mirrors real table columns
const DesktopSkeleton: React.FC<{ colCount: number }> = ({ colCount }) => (
  <table className="w-full text-left text-sm">
    <thead className="bg-slate-50/80 border-b border-border text-xs uppercase text-text-muted font-bold tracking-wider">
      <tr>
        {Array.from({ length: colCount }).map((_, i) => (
          <th key={i} className="py-3.5 px-4">
            <div className="h-3 w-20 skeleton-shimmer rounded" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: colCount }).map((_, j) => (
            <td key={j} className="py-3 px-4">
              <div
                className="h-4 skeleton-shimmer rounded"
                style={{ width: `${60 + ((i + j) % 3) * 20}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// A2: Mobile skeleton — mirrors real card layout
const MobileSkeleton: React.FC = () => (
  <div className="divide-y divide-border">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="p-4 flex items-start justify-between">
        <div className="space-y-2 flex-1 pr-4">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-16 skeleton-shimmer rounded" />
            <div className="h-5 w-12 skeleton-shimmer rounded-chip" />
          </div>
          <div className="h-4 w-40 skeleton-shimmer rounded" />
          <div className="h-3 w-28 skeleton-shimmer rounded" />
        </div>
        <div className="h-5 w-20 skeleton-shimmer rounded" />
      </div>
    ))}
  </div>
);

export function DataGrid<
  T extends {
    id: string;
    displayID?: string;
    primaryText?: string;
    secondaryText?: string | null;
    amount?: number;
    statusBadge?: string;
    createdAt?: string;
    tags?: string[];
  }
>({
  queryKey,
  endpoint,
  columns,
  filters = {},
  filterChips,
  searchPlaceholder,
  emptyMessage = 'No records found',
  onRowClick,
  renderMobileRow,
}: DataGridProps<T>) {
  const { isMobile } = useResponsive();
  const {
    data,
    isLoading,
    isFetching,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    goFirst,
    goPrev,
    goNext,
    goLast,
  } = useGrid<T>({
    queryKey,
    endpoint,
    filters,
  });

  // A2: Only show skeleton when data is undefined (first load), never during refetch
  // keepPreviousData ensures old data stays visible during pagination
  const showSkeleton = isLoading && data === undefined;

  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const isFirstPage = data?.isFirstPage ?? page <= 1;
  const isLastPage = data?.isLastPage ?? page >= totalPages;

  return (
    <div className="w-full">
      {/* A1: Search Bar + filter chips — no-scrollbar on chips row */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
        filterChips={filterChips}
      />

      {/* Main Grid View */}
      <div
        className="relative rounded-t-card border border-border border-b-0 overflow-hidden shadow-card"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Thin progress bar for refetch (not initial load) */}
        {isFetching && !showSkeleton && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-10">
            <div className="h-full bg-primary animate-[shimmer_1s_ease-in-out_infinite] w-1/3" />
          </div>
        )}

        {/* A2: Skeleton loader — shimmer, not pulse */}
        {showSkeleton ? (
          isMobile ? (
            <MobileSkeleton />
          ) : (
            <div className="overflow-x-hidden">
              <DesktopSkeleton colCount={columns.length} />
            </div>
          )
        ) : items.length === 0 ? (
          /* Empty State */
          <EmptyState icon={Inbox} title="No records found" description={emptyMessage} />
        ) : isMobile ? (
          /* Mobile Card List */
          <div className="divide-y divide-border">
            {items.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick && onRowClick(row)}
                className={clsx(
                  'p-3 transition-colors active:bg-slate-50',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {renderMobileRow ? (
                  renderMobileRow(row)
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {row.displayID || row.id.slice(0, 8)}
                        </span>
                        {row.statusBadge && <StatusBadge status={row.statusBadge} />}
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {row.primaryText || 'Untitled'}
                      </p>
                      {row.secondaryText && (
                        <p className="text-xs text-text-muted">{row.secondaryText}</p>
                      )}
                      {row.createdAt && (
                        <p className="text-[11px] text-text-muted">{formatDate(row.createdAt)}</p>
                      )}
                    </div>
                    {typeof row.amount === 'number' && (
                      <Money value={row.amount} size="md" className="font-bold" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* A1: Desktop Table View — overflow-x-auto with no-scrollbar */
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm">
              <thead
                className="border-b border-border text-xs uppercase text-text-muted font-bold tracking-wider"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-app) 50%, transparent)' }}
              >
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={clsx(
                        'py-3 px-4',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={clsx(
                      'transition-colors hover:bg-slate-50/60',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={clsx(
                          'py-3 px-4',
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className
                        )}
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '')
                          : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onFirst={goFirst}
        onPrev={goPrev}
        onNext={goNext}
        onLast={goLast}
      />
    </div>
  );
}
