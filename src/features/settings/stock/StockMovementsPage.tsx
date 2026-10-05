import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { phase11Api, StockMovement, Product } from '../../../api/phase11';

export const StockMovementsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get('productId') || '';
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [selectedType, setSelectedType] = useState('');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => phase11Api.getProducts(),
  });

  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stockMovements', selectedProductId, selectedType],
    queryFn: () =>
      phase11Api.getStockMovements({
        productId: selectedProductId || undefined,
        type: selectedType || undefined,
      }),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/settings/stock"
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Back to stock"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Stock Movement Ledger"
          subtitle="Audit log of all stock adjustments, purchases, sales, and return transactions"
        />
      </div>

      {/* Filters */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label htmlFor="movement-product-filter" className="block text-[11px] font-bold text-text-muted uppercase mb-1">
              Filter by Product
            </label>
            <select
              id="movement-product-filter"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="movement-type-filter" className="block text-[11px] font-bold text-text-muted uppercase mb-1">
              Filter by Type
            </label>
            <select
              id="movement-type-filter"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All Types</option>
              <option value="Adjust">Adjust</option>
              <option value="Purchase">Purchase</option>
              <option value="Sale">Sale</option>
              <option value="Return">Return</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ledger Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <History className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No movement records found</h4>
            <p className="text-xs text-text-muted">
              Stock movement events appear here automatically when stock is adjusted, purchased, or sold.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="stock-movements-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => {
                  const isPositive = m.qty > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        {m.productName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.type === 'Purchase'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : m.type === 'Adjust'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : m.type === 'Sale'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-bold ${
                          isPositive ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {isPositive ? `+${m.qty}` : m.qty}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                        {m.balance}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {m.by}
                      </td>
                      <td className="px-4 py-3 text-text-muted max-w-xs truncate">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
