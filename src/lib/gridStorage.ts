/**
 * Persistent Grid Filter and Settings Storage
 * Saves and restores grid configurations across sessions using client-side localStorage and Cookies.
 */

export function setClientStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, serialized);
    }
    // Also store in cookie (valid for 30 days)
    if (typeof document !== 'undefined') {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(serialized)}; expires=${expires}; path=/; SameSite=Lax`;
    }
  } catch {}
}

export function getClientStorage<T>(key: string, defaultValue: T): T {
  try {
    // 1. Try localStorage first
    if (typeof localStorage !== 'undefined') {
      const localVal = localStorage.getItem(key);
      if (localVal) {
        return JSON.parse(localVal) as T;
      }
    }

    // 2. Try cookie fallback
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${encodeURIComponent(key)}=`));
      if (match) {
        const val = decodeURIComponent(match.split('=')[1]);
        return JSON.parse(val) as T;
      }
    }
  } catch {}

  return defaultValue;
}

export function removeClientStorage(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    if (typeof document !== 'undefined') {
      document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
    }
  } catch {}
}
