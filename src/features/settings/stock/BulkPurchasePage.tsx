import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { phase11Api, Product } from '../../../api/phase11';
import { useAccessibleShops } from '../../../hooks/useAccessibleShops';

interface BulkRow {
  id: string;
  productId: string;
  qty: number | '';
  costPrice: number | '';
}

export const BulkPurchasePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { shops } = useAccessibleShops();
  const [selectedShopId, setSelectedShopId] = useState('');

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => phase11Api.getProducts(),
  });

  React.useEffect(() => {
    if (shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  const [rows, setRows] = useState<BulkRow[]>([
    { id: 'row-1', productId: '', qty: '', costPrice: '' },
  ]);

  React.useEffect(() => {
    if (products.length > 0 && rows.length === 1 && !rows[0].productId) {
      setRows([
        {
          id: 'row-1',
          productId: products[0].id,
          qty: 10,
          costPrice: products[0].costPrice || '',
        },
      ]);
    }
  }, [products]);

  const handleAddRow = () => {
    const firstProd = products[0];
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        productId: firstProd ? firstProd.id : '',
        qty: 1,
        costPrice: firstProd?.costPrice || '',
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof BulkRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'productId') {
            const p = products.find((prod) => prod.id === value);
            if (p) updated.costPrice = p.costPrice || '';
          }
          return updated;
        }
        return r;
      })
    );
  };

  const bulkMutation = useMutation({
    mutationFn: (items: Array<{ productId: string; qty: number; costPrice?: number }>) =>
      phase11Api.bulkPurchaseStock({
        shopId: selectedShopId || shops[0]?.id,
        items,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      toast.success(`Successfully added stock for ${res.updatedCount} products`);
      navigate('/settings/stock');
    },
    onError: () => {
      toast.error('Failed to submit bulk purchase');
    },
  });

  const handleSaveAll = () => {
    const validRows = rows.filter((r) => r.productId && r.qty !== '' && Number(r.qty) > 0);
    if (validRows.length === 0) {
      toast.error('Please enter at least one product with quantity > 0');
      return;
    }

    bulkMutation.mutate(
      validRows.map((r) => ({
        productId: r.productId,
        qty: Number(r.qty),
        costPrice: r.costPrice === '' ? undefined : Number(r.costPrice),
      }))
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/stock"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to stock"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Bulk Stock Purchase"
          subtitle="Record multi-item inventory receipts and replenish store warehouses"
        />
      </div>

      <Card className="border-border shadow-card p-5 space-y-5" style={{ backgroundColor: 'var(--bg-card)' }}>
        {shops.length > 1 && (
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <label htmlFor="bulk-shop-select" className="text-xs font-bold text-text-muted uppercase">
              Target Shop:
            </label>
            <select
              id="bulk-shop-select"
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoadingProducts ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="bulk-purchase-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 w-32">Qty</th>
                  <th className="p-3 w-36">Unit Cost (₹)</th>
                  <th className="p-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-3">
                      <select
                        value={row.productId}
                        onChange={(e) => handleUpdateRow(row.id, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
                        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.sku ? `(${p.sku})` : ''} - ₹{p.sellingPrice}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={row.qty}
                        onChange={(e) => handleUpdateRow(row.id, 'qty', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        required
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Cost"
                        value={row.costPrice}
                        onChange={(e) => handleUpdateRow(row.id, 'costPrice', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                        className="p-1.5 text-text-muted hover:text-danger disabled:opacity-30 rounded transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="add-bulk-row-btn"
            onClick={handleAddRow}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Row
          </Button>

          <Button
            type="button"
            id="save-all-bulk-btn"
            onClick={handleSaveAll}
            isLoading={bulkMutation.isPending}
          >
            <Check className="w-4 h-4 mr-1.5" />
            Save All
          </Button>
        </div>
      </Card>
    </div>
  );
};
