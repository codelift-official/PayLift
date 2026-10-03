import { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (typeof data === 'string') return data;
    if (error.response?.status === 400) return 'Invalid request';
    if (error.response?.status === 401) return 'Invalid credentials or session expired';
    if (error.response?.status === 403) return 'Access denied';
    if (error.response?.status === 404) return 'Resource not found';
    if (error.response?.status === 429) return 'Too many attempts, try again later';
    if (error.response?.status === 500) return 'Something went wrong on the server';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function handleAuthError(error: unknown) {
  const message = getApiErrorMessage(error);
  toast.error(message);
}
