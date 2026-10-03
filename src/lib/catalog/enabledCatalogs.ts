// Persistence for enabled catalogs configuration (V1: localStorage)
// TODO: Migrate to /api/v1/settings/catalogs when backend ready

export const ALL_CATALOG_IDS = [
  'clothing',
  'bakery',
  'grocery',
  'electronics',
  'cosmetics',
];

export function getEnabledCatalogIds(tenantId: number | string = 1): string[] {
  if (typeof window === 'undefined') return ALL_CATALOG_IDS;
  const key = `billify.enabledCatalogs.${tenantId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return ALL_CATALOG_IDS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ALL_CATALOG_IDS;
  } catch {
    return ALL_CATALOG_IDS;
  }
}

export function setEnabledCatalogIds(tenantId: number | string = 1, ids: string[]): void {
  if (typeof window === 'undefined') return;
  const key = `billify.enabledCatalogs.${tenantId}`;
  localStorage.setItem(key, JSON.stringify(ids));
  // Dispatch custom storage event for in-tab sync
  window.dispatchEvent(new Event('billify:catalogs-changed'));
}
