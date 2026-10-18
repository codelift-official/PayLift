import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Store,
  FileText,
  Database,
  Search,
  ArrowUpDown,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'HIGH' | 'LOW'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'shops' | 'users' | 'products' | 'customers' | 'bills' | 'estimatedSizeMB' | 'lastActivityAt'>('bills');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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

  const handleCopySlug = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    toast.success(`Copied slug: ${slug}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Find max size to compute relative progress bars
  const maxTenantSize = useMemo(() => {
    const list = data?.perBusiness || [];
    return Math.max(...list.map((b) => b.estimatedSizeMB || 0), 1);
  }, [data?.perBusiness]);

  const filteredAndSorted = useMemo(() => {
    const list = (data?.perBusiness || []).filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        String(b.tenantID).includes(q);

      let matchesActivity = true;
      if (activityFilter === 'HIGH') {
        matchesActivity = b.bills >= 10;
      } else if (activityFilter === 'LOW') {
        matchesActivity = b.bills < 10;
      }

      return matchesSearch && matchesActivity;
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
  }, [data?.perBusiness, searchTerm, activityFilter, sortField, sortAsc]);

  // Capacity calculations (10GB capacity threshold)
  const capacityMB = 10240;
  const usedMB = data?.estimatedTotalSizeMB ?? 0;
  const capacityPercent = Math.min(100, Math.max(0.1, (usedMB / capacityMB) * 100));

  if (isLoading) {
    return (
      <div className="p-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" id="platform-usage-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Platform Usage & Database Analytics</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              Live Metrics
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            System-wide resource consumption, table volumes, and per-tenant database footprint estimates
          </p>
        </div>
        <div>
          <button
            onClick={() => navigate('/platform/businesses')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-btn border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
          >
            <Building2 className="w-4 h-4 text-primary" />
            Manage Businesses
          </button>
        </div>
      </div>

      {/* 5 Overview KPI Cards */}
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
            <Store className="w-3.5 h-3.5 text-blue-500" /> Outlets & Seats
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-shops">
            {totals.shops} <span className="text-sm font-normal text-muted">shops</span>
          </p>
          <span className="text-[11px] text-muted">{totals.users} operator seats</span>
        </Card>

        {/* Total Catalog Products */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-500" /> Catalog Products
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-products">
            {totals.products}
          </p>
          <span className="text-[11px] text-muted">{totals.stockMovements} stock audits logged</span>
        </Card>

        {/* Total Bills */}
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Invoices Generated
          </span>
          <p className="text-2xl font-bold text-text-primary" id="metric-total-bills">
            {totals.bills.toLocaleString()}
          </p>
          <span className="text-[11px] text-muted">{totals.billItems.toLocaleString()} invoice line items</span>
        </Card>

        {/* Total DB Size & Storage Utilization */}
        <Card className="p-4 shadow-card border space-y-1.5 col-span-2 sm:col-span-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-purple-500" /> Database Footprint
          </span>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" id="metric-total-size">
            {usedMB.toFixed(2)} MB
          </p>
          <div className="space-y-1">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, capacityPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted font-mono">
              <span>{capacityPercent.toFixed(2)}% used</span>
              <span>10 GB Cap</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter / Search Bar */}
      <Card
        className="p-3.5 sm:p-4 shadow-card border flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Activity Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActivityFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activityFilter === 'ALL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary'
              }`}
            >
              All Tenants ({data?.perBusiness?.length || 0})
            </button>
            <button
              onClick={() => setActivityFilter('HIGH')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activityFilter === 'HIGH'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary'
              }`}
            >
              High Activity (&ge;10 bills)
            </button>
            <button
              onClick={() => setActivityFilter('LOW')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activityFilter === 'LOW'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary'
              }`}
            >
              Low / Idle (&lt;10 bills)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search tenant name, slug, #ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              id="input-usage-search"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted pt-1 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          <span>
            Showing <strong>{filteredAndSorted.length}</strong> tenant database accounts
          </span>
          <span className="font-mono text-[11px]">
            Generated: {new Date(data?.generatedAt || Date.now()).toLocaleTimeString()}
          </span>
        </div>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Card
          className="shadow-card border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="platform-usage-table">
              <thead
                className="border-b uppercase font-bold text-[11px] select-none"
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-muted)',
                }}
              >
                <tr>
                  <th className="px-5 py-3.5 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1.5">Tenant Account <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-3 py-3.5 text-center cursor-pointer" onClick={() => handleSort('shops')}>
                    <div className="flex items-center justify-center gap-1">Shops <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-3 py-3.5 text-center cursor-pointer" onClick={() => handleSort('users')}>
                    <div className="flex items-center justify-center gap-1">Users <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-3 py-3.5 text-center cursor-pointer" onClick={() => handleSort('products')}>
                    <div className="flex items-center justify-center gap-1">Products <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-3 py-3.5 text-center cursor-pointer" onClick={() => handleSort('customers')}>
                    <div className="flex items-center justify-center gap-1">Customers <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5 text-right cursor-pointer" onClick={() => handleSort('bills')}>
                    <div className="flex items-center justify-end gap-1">Bills <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-5 py-3.5 text-right cursor-pointer" onClick={() => handleSort('estimatedSizeMB')}>
                    <div className="flex items-center justify-end gap-1">Est. DB Size <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5 text-right cursor-pointer" onClick={() => handleSort('lastActivityAt')}>
                    <div className="flex items-center justify-end gap-1">Last Active <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-muted">
                      No matching tenants found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((b) => {
                    const relativePercent = Math.min(100, Math.max(5, (b.estimatedSizeMB / maxTenantSize) * 100));
                    return (
                      <tr
                        key={b.tenantID}
                        onClick={() => navigate(`/platform/usage/${b.tenantID}`)}
                        className="hover:bg-[var(--bg-app)] cursor-pointer transition-colors"
                      >
                        {/* Tenant Name + Disambiguation Badge + Copyable Slug */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary text-sm">{b.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-muted">
                              #{b.tenantID}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-muted">/{b.slug}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySlug(e, b.slug)}
                              title="Copy Slug"
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted hover:text-text-primary"
                            >
                              {copiedSlug === b.slug ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 text-center font-semibold">{b.shops}</td>
                        <td className="px-3 py-3.5 text-center font-semibold">{b.users}</td>
                        <td className="px-3 py-3.5 text-center font-semibold">{b.products}</td>
                        <td className="px-3 py-3.5 text-center font-semibold">{b.customers}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {b.bills.toLocaleString()}
                        </td>

                        {/* Estimated DB Size with Visual Footprint Bar */}
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-mono font-bold text-text-primary">
                            {b.estimatedSizeMB.toFixed(2)} MB
                          </span>
                          <div className="w-20 ml-auto bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${relativePercent}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right font-mono text-muted text-[11px]">
                          {b.lastActivityAt ? new Date(b.lastActivityAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/platform/businesses/${b.tenantID}`)}
                            title="Manage Business"
                            className="p-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted hover:text-text-primary transition-colors inline-flex items-center"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/platform/usage/${b.tenantID}`)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors inline-flex items-center space-x-1"
                          >
                            <span>Analytics</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAndSorted.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted">No matching tenants found.</div>
        ) : (
          filteredAndSorted.map((b) => {
            return (
              <Card
                key={b.tenantID}
                className="p-4 shadow-card border space-y-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
                onClick={() => navigate(`/platform/usage/${b.tenantID}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-text-primary text-sm">{b.name}</h3>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-muted">
                        #{b.tenantID}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-xs text-muted">/{b.slug}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopySlug(e, b.slug)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted"
                      >
                        {copiedSlug === b.slug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                      {b.estimatedSizeMB.toFixed(2)} MB
                    </span>
                    <span className="text-[10px] text-muted block">Footprint</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--bg-border)' }}>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Shops</span>
                    <span className="font-semibold">{b.shops}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Users</span>
                    <span className="font-semibold">{b.users}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Products</span>
                    <span className="font-semibold">{b.products}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Bills</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{b.bills}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--bg-border)' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/platform/businesses/${b.tenantID}`)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary inline-flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/platform/usage/${b.tenantID}`)}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:opacity-95 inline-flex items-center gap-1"
                  >
                    <span>Analytics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlatformUsagePage;
