import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataGrid, ColumnDef } from '../../components/DataGrid/DataGrid';
import { BillSummaryResponse } from '../../api/types';
import { PageHeader } from '../../components/PageHeader';
import { Chip } from '../../components/ui/Chip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Money } from '../../components/Money';
import { formatDate } from '../../lib/format';
import { Plus, X, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const BillsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params on mount to pre-populate filters (Item 4 & Item 6)
  const initialMode = searchParams.get('mode') || searchParams.get('Mode') || 'All';
  const initialDate = searchParams.get('dateRange') || searchParams.get('date') || 'All';
  const initialStatus = searchParams.get('status') || searchParams.get('Status') || 'All';
  const initialShop = searchParams.get('shop') || searchParams.get('shopID') || searchParams.get('ShopID') || 'All';

  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>(
    (['Today', 'Week', 'Month'].includes(initialDate) ? initialDate : 'All') as any
  );
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Cash' | 'UPI' | 'Card'>(
    (['Cash', 'UPI', 'Card'].includes(initialMode) ? initialMode : 'All') as any
  );
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [shopFilter, setShopFilter] = useState<string>(initialShop);

  // Sync state to URL params when filters change (Item 4 & 6)
  const updateUrlParams = (newFilters: {
    mode?: string;
    dateRange?: string;
    status?: string;
    shop?: string;
  }) => {
    const next = new URLSearchParams(searchParams);
    const m = newFilters.mode !== undefined ? newFilters.mode : paymentFilter;
    const d = newFilters.dateRange !== undefined ? newFilters.dateRange : dateFilter;
    const s = newFilters.status !== undefined ? newFilters.status : statusFilter;
    const sh = newFilters.shop !== undefined ? newFilters.shop : shopFilter;

    if (m && m !== 'All') next.set('mode', m);
    else next.delete('mode');

    if (d && d !== 'All') next.set('dateRange', d);
    else next.delete('dateRange');

    if (s && s !== 'All') next.set('status', s);
    else next.delete('status');

    if (sh && sh !== 'All') next.set('shop', sh);
    else next.delete('shop');

    setSearchParams(next, { replace: true });
  };

  const handlePaymentChange = (mode: 'All' | 'Cash' | 'UPI' | 'Card') => {
    setPaymentFilter(mode);
    updateUrlParams({ mode });
  };

  const handleDateChange = (range: 'All' | 'Today' | 'Week' | 'Month') => {
    setDateFilter(range);
    updateUrlParams({ dateRange: range });
  };

  // Convert date filter to fromDate & toDate
  const { fromDate, toDate } = useMemo(() => {
    if (dateFilter === 'All') return { fromDate: undefined, toDate: undefined };
    const now = new Date();
    const to = now.toISOString();
    const from = new Date();

    if (dateFilter === 'Today') {
      from.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'Week') {
      from.setDate(now.getDate() - 7);
    } else if (dateFilter === 'Month') {
      from.setDate(now.getDate() - 30);
    }

    return { fromDate: from.toISOString(), toDate: to };
  }, [dateFilter]);

  const columns: ColumnDef<BillSummaryResponse>[] = [
    {
      header: 'Bill #',
      accessorKey: 'displayID',
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-primary">
          {row.displayID || `#${row.id.slice(0, 8)}`}
        </span>
      ),
    },
    {
      header: 'Customer / Items',
      accessorKey: 'primaryText',
      cell: (row) => (
        <div>
          <p className="font-semibold text-text-primary text-sm">{row.primaryText}</p>
          {row.secondaryText && (
            <p className="text-xs text-text-muted mt-0.5">{row.secondaryText}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'statusBadge',
      cell: (row) => <StatusBadge status={row.statusBadge || 'Paid'} />,
    },
    {
      header: 'Date & Time',
      accessorKey: 'createdAt',
      cell: (row) => (
        <span className="text-xs text-text-muted">
          {row.createdAt ? formatDate(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      align: 'right',
      cell: (row) => (
        <div className="font-bold">
          <Money value={row.amount} size="md" />
        </div>
      ),
    },
  ];

  const filterChips = (
    <>
      <div className="flex items-center space-x-1 border-r border-border pr-2 mr-1">
        {(['All', 'Today', 'Week', 'Month'] as const).map((df) => (
          <Chip
            key={df}
            label={df}
            selected={dateFilter === df}
            onClick={() => handleDateChange(df)}
          />
        ))}
      </div>
      <div className="flex items-center space-x-1">
        {(['All', 'Cash', 'UPI', 'Card'] as const).map((pf) => (
          <Chip
            key={pf}
            label={pf}
            selected={paymentFilter === pf}
            onClick={() => handlePaymentChange(pf)}
          />
        ))}
      </div>
    </>
  );

  // Active filters for dismissible chips (Item 4)
  const activeFilters = [
    paymentFilter !== 'All' && {
      key: 'mode',
      label: `Mode: ${paymentFilter}`,
      onClear: () => handlePaymentChange('All'),
    },
    dateFilter !== 'All' && {
      key: 'date',
      label: `Date: ${dateFilter}`,
      onClear: () => handleDateChange('All'),
    },
    statusFilter !== 'All' && {
      key: 'status',
      label: `Status: ${statusFilter}`,
      onClear: () => {
        setStatusFilter('All');
        updateUrlParams({ status: 'All' });
      },
    },
    shopFilter !== 'All' && {
      key: 'shop',
      label: `Shop: ${shopFilter.slice(0, 8)}`,
      onClear: () => {
        setShopFilter('All');
        updateUrlParams({ shop: 'All' });
      },
    },
  ].filter(Boolean) as Array<{ key: string; label: string; onClear: () => void }>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bills & Invoices"
        subtitle="View and search checkout bills"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/bills/new')}
            className="hidden sm:inline-flex"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Bill
          </Button>
        }
      />

      {/* Item 4: Active dismissible chips above grid */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-text-muted flex items-center font-medium">
            <Filter className="w-3.5 h-3.5 mr-1" />
            Active Filters:
          </span>
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold"
            >
              {f.label}
              <button
                type="button"
                onClick={f.onClear}
                className="hover:text-primary-hover focus:outline-none p-0.5"
                title="Remove filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              setPaymentFilter('All');
              setDateFilter('All');
              setStatusFilter('All');
              setShopFilter('All');
              const next = new URLSearchParams(searchParams);
              next.delete('mode');
              next.delete('Mode');
              next.delete('dateRange');
              next.delete('date');
              next.delete('status');
              next.delete('shop');
              setSearchParams(next, { replace: true });
            }}
            className="text-text-muted hover:text-text-primary underline ml-1 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      <DataGrid<BillSummaryResponse>
        queryKey={['bills', dateFilter, paymentFilter, statusFilter, shopFilter]}
        endpoint="/api/v1/bills"
        filters={{
          mode: paymentFilter !== 'All' ? paymentFilter : undefined,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          shopID: shopFilter !== 'All' ? shopFilter : undefined,
          fromDate: fromDate,
          toDate: toDate,
        }}
        columns={columns}
        filterChips={filterChips}
        searchPlaceholder="Search by bill #, customer, or phone..."
        emptyMessage="No bills match your current filters. Create a new bill to get started."
        onRowClick={(row) => navigate(`/bills/${row.id}`)}
      />
    </div>
  );
};
export default BillsListPage;
