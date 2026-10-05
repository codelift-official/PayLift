import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  PackageCheck,
  Plus,
  History,
  Loader2,
  Store,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Money } from '../../../components/Money';
import { phase11Api, StockItem } from '../../../api/phase11';
import { useAccessibleShops } from '../../../hooks/useAccessibleShops';
import { useAuthStore, isBusinessAdmin } from '../../../stores/auth.store';
import { StockAdjustModal } from './StockAdjustModal';
import { StockPurchaseModal } from './StockPurchaseModal';

export const StockListPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = isBusinessAdmin(user);
  const { shops } = useAccessibleShops();

  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [purchaseItem, setPurchaseItem] = useState<StockItem | null>(null);

  React.useEffect(() => {
    if (shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ['stock', selectedShopId, lowStockOnly],
    queryFn: () =>
      phase11Api.getStock({
        shopId: selectedShopId || undefined,
        lowStockOnly,
      }),
  });

  const lowStockCount = stockItems.filter(
    (s) => s.isLowStock || s.quantity <= s.lowStockThreshold
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Stock & Inventory"
          subtitle="Real-time warehouse stock tracking, threshold warnings and replenishment"
        />

        <div className="flex items-center gap-2.5">
          <Link to="/settings/stock/movements">
            <Button variant="outline" size="sm">
              <History className="w-4 h-4 mr-1.5" />
              History
            </Button>
          </Link>

          <Link to="/settings/stock/bulk-purchase">
            <Button size="sm" id="bulk-purchase-nav-btn">
              <Plus className="w-4 h-4 mr-1.5" />
              Bulk Purchase
            </Button>
          </Link>
        </div>
      </div>

      {/* Low-stock Amber Banner */}
      {lowStockCount > 0 && (
        <div
          id="low-stock-alert-banner"
          className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Low Stock Alert: {lowStockCount} {lowStockCount === 1 ? 'product is' : 'products are'} running low!
              </p>
              <p className="text-xs opacity-90">
                Quantity is below minimum threshold. Please order replenishment to prevent stockouts.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLowStockOnly(true)}
            className="border-amber-500/40 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-xs shrink-0"
          >
            View Low Stock
          </Button>
        </div>
      )}

      {/* Control bar: Shop selector & Filter */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Shop Selector: Admin can switch, Manager locked */}
          <div className="flex items-center gap-2.5">
            <Store className="w-4 h-4 text-text-muted shrink-0" />
            {isAdmin && shops.length > 1 ? (
              <select
                id="stock-shop-selector"
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-border rounded-button focus:border-primary focus:outline-none"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold text-text-primary px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">
                {shops.find((s) => s.id === selectedShopId)?.name || shops[0]?.name || 'Current Shop'}
                {!isAdmin && (
                  <span className="ml-1.5 text-[10px] text-text-muted font-normal">
                    (Locked)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Low Stock Filter Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="low-stock-filter-checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-border text-primary cursor-pointer w-4 h-4"
            />
            <span className="text-xs font-semibold text-text-primary">
              Low stock only
            </span>
          </label>
        </div>
      </Card>

      {/* Stock Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stockItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PackageCheck className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No stock records found</h4>
            <p className="text-xs text-text-muted">
              {lowStockOnly
                ? 'All products are currently well-stocked above their minimum thresholds.'
                : 'Products added to your catalog will show up here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="stock-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Low</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockItems.map((item) => {
                  const isLow = item.isLowStock || item.quantity <= item.lowStockThreshold;
                  const totalValue = item.quantity * (item.unitCost || 0);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        isLow ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-text-primary block text-sm">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[10px] text-text-muted">
                          SKU: {item.sku || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isLow ? 'text-amber-600 dark:text-amber-400' : 'text-text-primary'
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-text-muted font-medium">
                        {item.unit}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-text-muted">
                        {item.lowStockThreshold}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-text-primary">
                        <Money value={totalValue} size="sm" />
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            data-testid={`adjust-stock-btn-${item.productId}`}
                            onClick={() => setAdjustItem(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-button bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary transition-colors action-adjust-btn"
                          >
                            Adjust
                          </button>

                          <button
                            type="button"
                            data-testid={`purchase-stock-btn-${item.productId}`}
                            onClick={() => setPurchaseItem(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-button bg-primary/10 hover:bg-primary/20 text-primary transition-colors action-purchase-btn"
                          >
                            Purchase
                          </button>

                          <Link
                            to={`/settings/stock/movements?productId=${item.productId}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-button text-text-muted hover:text-text-primary transition-colors"
                            title="View stock history"
                          >
                            History
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Adjust Modal */}
      <StockAdjustModal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
      />

      {/* Purchase Modal */}
      <StockPurchaseModal
        isOpen={Boolean(purchaseItem)}
        onClose={() => setPurchaseItem(null)}
        item={purchaseItem}
      />
    </div>
  );
};
