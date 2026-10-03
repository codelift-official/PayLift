import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterChips?: React.ReactNode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search by bill #, customer, or phone...',
  filterChips,
}) => {
  return (
    <div className="w-full space-y-3 mb-4">
      <div className="relative flex items-center w-full">
        <div className="absolute left-3.5 pointer-events-none text-text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 border border-border rounded-button text-sm placeholder:text-text-muted shadow-sm focus:border-primary transition-colors"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-slate-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* A1: filter chip row — no-scrollbar hides scrollbar, overflow-x-auto keeps scroll */}
      {filterChips && (
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-0.5">
          {filterChips}
        </div>
      )}
    </div>
  );
};
