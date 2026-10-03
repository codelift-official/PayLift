export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const CACHE_STALE_TIME_MS = 30_000; // 30 seconds (matches server cache)
export const CACHE_GC_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [25, 50, 100];
