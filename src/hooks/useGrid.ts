import { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { PagedResult } from '../api/types';

export interface UseGridOptions {
  queryKey: string[];
  endpoint: string;
  filters?: Record<string, unknown>;
  initialPageSize?: number;
}

export function useGrid<T>({
  queryKey,
  endpoint,
  filters = {},
  initialPageSize = 50,
}: UseGridOptions) {
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [search, setSearchState] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // 300ms debounce on search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search change
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Item 4: On filter change -> reset page to 1
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  const setSearch = (term: string) => {
    setSearchState(term);
  };

  // Build params with Page & PageSize and lowercase filter keys per backend wiring
  const requestParams = useMemo(() => {
    const params: Record<string, unknown> = {
      Page: page,
      PageSize: pageSize,
    };

    if (debouncedSearch && debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== 'All') {
        // Enforce lowercase first character (e.g. mode, shopID, status, fromDate, toDate)
        const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
        params[lowerKey] = val;
      }
    });

    return params;
  }, [page, pageSize, debouncedSearch, filters]);

  // Fetch query with filter values in queryKey array
  const { data, isLoading, isFetching, error, refetch } = useQuery<PagedResult<T>>({
    queryKey: [...queryKey, page, pageSize, debouncedSearch, filters],
    queryFn: async () => {
      const res = await apiClient.get<PagedResult<T>>(endpoint, {
        params: requestParams,
      });
      return res.data;
    },
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const goFirst = () => {
    if (data?.firstPage) setPage(data.firstPage);
    else setPage(1);
  };

  const goPrev = () => {
    if (data?.hasPrev) setPage((p) => Math.max(1, p - 1));
  };

  const goNext = () => {
    if (data?.hasNext) setPage((p) => p + 1);
  };

  const goLast = () => {
    if (data?.lastPage) setPage(data.lastPage);
  };

  return {
    data,
    isLoading,
    isFetching,
    error,
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
    refetch,
  };
}
