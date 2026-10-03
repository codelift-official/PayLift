import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { reportsApi } from '../../api/reports';
import { shopsApi } from '../../api/shops';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/ui/Card';
import { Money } from '../../components/Money';
import { toast } from 'sonner';
import {
  TrendingUp,
  Receipt,
  RotateCcw,
  IndianRupee,
  Calendar,
  Store,
  CreditCard,
  Banknote,
  Smartphone,
  Download,
  X,
  Filter,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ReportsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRange = searchParams.get('dateRange') || searchParams.get('range') || 'Month';
  const initialShop = searchParams.get('shopID') || searchParams.get('shop') || 'All';

  const [dateRange, setDateRange] = useState<'Today' | 'Week' | 'Month' | 'Custom'>(
    (['Today', 'Week', 'Month', 'Custom'].includes(initialRange) ? initialRange : 'Month') as any
  );
  const [selectedShopId, setSelectedShopId] = useState<string>(initialShop);

  // Sync state with URL params
  const updateUrl = (newRange: string, newShop: string) => {
    const next = new URLSearchParams(searchParams);
    if (newRange && newRange !== 'Month') next.set('dateRange', newRange);
    else next.delete('dateRange');

    if (newShop && newShop !== 'All') next.set('shopID', newShop);
    else next.delete('shopID');

    setSearchParams(next, { replace: true });
  };

  const handleRangeChange = (r: 'Today' | 'Week' | 'Month' | 'Custom') => {
    setDateRange(r);
    updateUrl(r, selectedShopId);
  };

  const handleShopChange = (s: string) => {
    setSelectedShopId(s);
    updateUrl(dateRange, s);
  };

  // Fetch shops for filter
  const { data: shops } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsApi.getShops,
  });

  // Calculate fromDate and toDate based on range
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const to = now.toISOString();
    const from = new Date();

    if (dateRange === 'Today') {
      from.setHours(0, 0, 0, 0);
    } else if (dateRange === 'Week') {
      from.setDate(now.getDate() - 7);
    } else if (dateRange === 'Month') {
      from.setDate(now.getDate() - 30);
    } else {
      from.setDate(now.getDate() - 90);
    }

    return { fromDate: from.toISOString(), toDate: to };
  }, [dateRange]);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports', 'summary', selectedShopId, dateRange, fromDate, toDate],
    queryFn: () =>
      reportsApi.getSummary({
        shopID: selectedShopId === 'All' ? undefined : selectedShopId,
        fromDate,
        toDate,
      }),
    staleTime: 60_000,
  });

  const activeShopObj = shops?.find((s) => s.id === selectedShopId);

  return (
    <div className="space-y-4 pb-20 sm:pb-6">
      {/* Header */}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Sales summaries, revenue breakdown, and tax reports"
        actions={
          <button
            type="button"
            onClick={() => toast.info('Export to CSV/PDF coming soon!')}
            className="hidden sm:inline-flex items-center px-4 py-2 border border-border rounded-button text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Report
          </button>
        }
      />

      {/* Date Range & Shop Selector Bar */}
      <Card
        className="border-border shadow-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Date Range Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
          <Calendar className="w-4 h-4 text-text-muted mr-1 shrink-0" />
          {(['Today', 'Week', 'Month', 'Custom'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRangeChange(r)}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 shrink-0',
                dateRange === r
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Shop Filter */}
        {shops && shops.length > 1 && (
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 text-text-muted shrink-0" />
            <select
              value={selectedShopId}
              onChange={(e) => handleShopChange(e.target.value)}
              className="text-xs border border-border rounded-input px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="All">All Locations</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Item 4: Active Dismissible Chips */}
      {(dateRange !== 'Month' || selectedShopId !== 'All') && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-text-muted font-medium flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Active Filters:
          </span>
          {dateRange !== 'Month' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              Range: {dateRange}
              <button
                type="button"
                onClick={() => handleRangeChange('Month')}
                className="hover:text-primary-hover focus:outline-none p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedShopId !== 'All' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
              Shop: {activeShopObj?.name || selectedShopId.slice(0, 8)}
              <button
                type="button"
                onClick={() => handleShopChange('All')}
                className="hover:text-primary-hover focus:outline-none p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 skeleton-shimmer rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Sales */}
          <Card className="p-4 border-border shadow-card flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales</span>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <Money value={summary?.totalSales ?? 0} size="display" />
              <p className="text-[11px] text-text-muted mt-1">{summary?.totalBills ?? 0} bills total</p>
            </div>
          </Card>

          {/* Net Sales */}
          <Card className="p-4 border-border shadow-card flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Net Sales</span>
              <IndianRupee className="w-4 h-4 text-success" />
            </div>
            <div className="mt-3">
              <div className="text-success">
                <Money value={summary?.netSales ?? 0} size="display" />
              </div>
              <p className="text-[11px] text-text-muted mt-1">Realized revenue</p>
            </div>
          </Card>

          {/* Returns */}
          <Card className="p-4 border-border shadow-card flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">Returns</span>
              <RotateCcw className="w-4 h-4 text-danger" />
            </div>
            <div className="mt-3 text-danger">
              <Money value={summary?.returns ?? 0} size="display" negative />
              <p className="text-[11px] text-text-muted mt-1">Total refunds processed</p>
            </div>
          </Card>

          {/* GST Collected */}
          <Card className="p-4 border-border shadow-card flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between text-text-muted">
              <span className="text-xs font-semibold uppercase tracking-wider">GST Collected</span>
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-3">
              <Money value={summary?.gstCollected ?? 0} size="display" />
              <p className="text-[11px] text-text-muted mt-1">Output tax payable</p>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Modes Breakdown */}
      <Card className="border-border shadow-card p-5" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-4 text-text-muted">
          Payment Modes Breakdown
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">Cash</p>
                <div className="font-bold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  <Money value={summary?.cash ?? 0} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">UPI</p>
                <div className="font-bold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  <Money value={summary?.upi ?? 0} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-app)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">Card</p>
                <div className="font-bold text-sm mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  <Money value={summary?.card ?? 0} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default ReportsPage;
