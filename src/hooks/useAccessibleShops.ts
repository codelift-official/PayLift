import { useQuery } from '@tanstack/react-query';
import { shopsApi } from '../api/shops';
import { useAuthStore } from '../stores/auth.store';
import { isBusinessAdmin } from '../stores/auth.store';

/**
 * Returns the list of shops accessible to the current user.
 *
 * - BusinessAdmin → all shops (GET /shops)
 * - Manager / Staff → only shops listed in user.assignedShopIDs
 *   (still fetches all, then filters client-side for simplicity)
 */
export function useAccessibleShops() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = isBusinessAdmin(user);

  const { data: allShops = [], isLoading, error } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
    enabled: !!user,
  });

  const shops = isAdmin
    ? allShops
    : (() => {
        const filtered = allShops.filter((shop) => {
          if (user?.assignedShopIDs && user.assignedShopIDs.length > 0) {
            return user.assignedShopIDs.includes(shop.id);
          }
          if (user?.defaultShopID) {
            return shop.id === user.defaultShopID;
          }
          return false;
        });
        // If staff/manager has no explicit restriction, fallback to allShops so billing works
        return filtered.length > 0 ? filtered : allShops;
      })();

  /** The default / first accessible shop */
  const defaultShop =
    shops.find((s) => s.id === user?.defaultShopID) ?? shops[0] ?? null;

  return { shops, defaultShop, isLoading, error, isAdmin };
}
