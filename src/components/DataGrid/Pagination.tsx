import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  totalCount,
  totalPages,
  isFirstPage,
  isLastPage,
  onPageSizeChange,
  onFirst,
  onPrev,
  onNext,
  onLast,
}) => {
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 bg-white border border-border rounded-b-card text-xs text-text-muted select-none">
      {/* Total count and range text */}
      <div>
        <span>
          Showing <strong className="text-text-primary">{startItem}</strong>–
          <strong className="text-text-primary">{endItem}</strong> of{' '}
          <strong className="text-text-primary">{totalCount}</strong> entries
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Page size selector */}
        <div className="flex items-center space-x-2">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border border-border rounded-button px-2 py-1 text-text-primary focus:border-primary cursor-pointer text-xs font-medium"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Page controls */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            disabled={isFirstPage}
            onClick={onFirst}
            title="First page"
            className="p-1.5 rounded-button border border-border bg-white text-text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isFirstPage}
            onClick={onPrev}
            title="Previous page"
            className="p-1.5 rounded-button border border-border bg-white text-text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="px-2 font-medium text-text-primary">
            Page {page} of {Math.max(1, totalPages)}
          </span>

          <button
            type="button"
            disabled={isLastPage}
            onClick={onNext}
            title="Next page"
            className="p-1.5 rounded-button border border-border bg-white text-text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLastPage}
            onClick={onLast}
            title="Last page"
            className="p-1.5 rounded-button border border-border bg-white text-text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
