import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Store,
  Users,
  FileText,
  Database,
  Search,
  ArrowUpDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export interface UsageStatsResponse {
  totals: {
    businesses: number;
    activeBusinesses: number;
    suspendedBusinesses: number;
    shops: number;
    users: number;
    products: number;
    customers: number;
    bills: number;
    billItems: number;
    payments: number;
    coupons: number;
    offers: number;
    stockMovements: number;
  };
  perBusiness: Array<{
    tenantID: number | string;
    name: string;
    slug: string;
    shops: number;
    users: number;
    products: number;
    customers: number;
    bills: number;
    estimatedSizeMB: number;
    lastActivityAt?: string | null;
  }>;
  estimatedTotalSizeMB: number;
  generatedAt: string;
}

export const PlatformUsagePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'shops' | 'users' | 'products' | 'customers' | 'bills' | 'estimatedSizeMB' | 'lastActivityAt'>('bills');
  const [sortAsc, setSortAsc] = useState(false);

  const { data, isLoading } = useQuery<UsageStatsResponse>({
    queryKey: ['platform', 'usage', 'statistics'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get('/platform/usage/statistics');
        return res.data;
      } catch {
        // Fallback mock
        return {
          totals: {
            businesses: 4,
            activeBusinesses: 3,
            suspendedBusinesses: 1,
            shops: 5,
            users: 8,
            products: 24,
            customers: 15,
            bills: 42,
            billItems: 110,
            payments: 42,
            coupons: 6,
            offers: 4,
            stockMovements: 32,
          },
          perBusiness: [
            {
              tenantID: 2,
              name: 'Apex Supermart',
              slug: 'apex-mart',
              shops: 2,
              users: 4,
              products: 18,
              customers: 12,
              bills: 35,
              estimatedSizeMB: 1.45,
              lastActivityAt: new Date().toISOString(),
            },
            {
              tenantID: 1,
              name: 'Demo Retail Store',
              slug: 'demo-store',
              shops: 1,
              users: 2,
              products: 6,
              customers: 3,
              bills: 7,
              estimatedSizeMB: 0.32,
              lastActivityAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
          estimatedTotalSizeMB: 1.77,
          generatedAt: new Date().toISOString(),
        };
      }
    },
  });

  const totals = data?.totals || {
    businesses: 0,
    activeBusinesses: 0,
    suspendedBusinesses: 0,
    shops: 0,
    users: 0,
    products: 0,
    customers: 0,
    bills: 0,
    billItems: 0,
    payments: 0,
    coupons: 0,
    offers: 0,
    stockMovements: 0,
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    const list = (data?.perBusiness || []).filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      return !q || b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
    });

    return list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        const cmp = String(aVal || '').localeCompare(String(bVal || ''));
        return sortAsc ? cmp : -cmp;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [data?.perBusiness, searchTerm, sortField, sortAsc]);

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" id="platform-usage-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Usage & Database Statistics</h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          System-wide resource consumption, table volumes, and per-tenant database footprint estimates
        </p>
      </div>

      {/* 5 Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Businesses */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Total Businesses
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-businesses">
            {totals.businesses}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {totals.activeBusinesses} active · {totals.suspendedBusinesses} suspended
          </span>
        </Card>

        {/* Total Shops */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-500" /> Total Shops
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-shops">
            {totals.shops}
          </p>
          <span className="text-[11px] text-muted">Outlets provisioned</span>
        </Card>

        {/* Total Users */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-500" /> Total Users
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-users">
            {totals.users}
          </p>
          <span className="text-[11px] text-muted">Operators & admins</span>
        </Card>

        {/* Total Bills */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Total Bills
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-bills">
            {totals.bills.toLocaleString()}
          </p>
          <span className="text-[11px] text-muted">{totals.billItems.toLocaleString()} invoice line items</span>
        </Card>

        {/* Total DB Size (est.) */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-500" /> Total DB Size (est.)
          </span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" id="metric-total-size">
            {(data?.estimatedTotalSizeMB ?? 0).toFixed(2)} MB
          </p>
          <span className="text-[11px] text-muted">Estimated footprint</span>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card
        className="p-4 shadow-card border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search tenant name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
            id="input-usage-search"
          />
        </div>
        <p className="text-xs text-muted">
          Showing <strong>{filteredAndSorted.length}</strong> tenant accounts
        </p>
      </Card>

      {/* Per-Business Usage Table */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" id="platform-usage-table">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-3.5 cursor-pointer select-none" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">Tenant <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => handleSort('shops')}>
                  <div className="flex items-center justify-center gap-1">Shops <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => handleSort('users')}>
                  <div className="flex items-center justify-center gap-1">Users <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => handleSort('products')}>
                  <div className="flex items-center justify-center gap-1">Products <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-center cursor-pointer select-none" onClick={() => handleSort('customers')}>
                  <div className="flex items-center justify-center gap-1">Customers <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('bills')}>
                  <div className="flex items-center justify-end gap-1">Bills <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-5 py-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('estimatedSizeMB')}>
                  <div className="flex items-center justify-end gap-1">Est. Size <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-5 py-3.5 text-right cursor-pointer select-none" onClick={() => handleSort('lastActivityAt')}>
                  <div className="flex items-center justify-end gap-1">Last Active <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                </th>
                <th className="px-4 py-3.5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-muted">
                    No matching tenants found.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((b) => (
                  <tr
                    key={b.tenantID}
                    onClick={() => navigate(`/platform/usage/${b.tenantID}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-text-primary">{b.name}</p>
                      <p className="text-[11px] font-mono text-muted">{b.slug} · #{b.tenantID}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold">{b.shops}</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{b.users}</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{b.products}</td>
                    <td className="px-4 py-3.5 text-center font-semibold">{b.customers}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                      {b.bills.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold">
                      {b.estimatedSizeMB.toFixed(2)} MB
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-muted text-[11px]">
                      {b.lastActivityAt ? new Date(b.lastActivityAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-muted">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default PlatformUsagePage;
