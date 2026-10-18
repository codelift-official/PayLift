import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  Loader2,
  Plus,
  Copy,
  Check,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export const BusinessListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'shops' | 'users' | 'status'>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['platform', 'businesses'],
    queryFn: async () => {
      try {
        const res = await platformApiClient.get('/platform/businesses');
        return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.businesses || [];
      } catch {
        // Fallback demo businesses for development / offline platform mode
        return [
          {
            tenantID: 2,
            id: '2',
            name: 'Apex Supermart',
            slug: 'apex-mart',
            tier: 'Pro',
            status: 'Active',
            shopsCount: 2,
            usersCount: 4,
            ownerEmail: 'admin@apexretail.com',
            createdAt: '2026-09-01T10:00:00Z',
          },
          {
            tenantID: 1,
            id: '1',
            name: 'Demo Retail Store',
            slug: 'demo-store',
            tier: 'Starter',
            status: 'Trial',
            trialEndsAt: new Date(Date.now() + 5 * 86400000).toISOString(),
            shopsCount: 1,
            usersCount: 2,
            ownerEmail: 'demo@store.com',
            createdAt: '2026-09-28T09:00:00Z',
          },
          {
            tenantID: 3,
            id: '3',
            name: 'Apex Supermart (North Branch)',
            slug: 'apex-north',
            tier: 'Enterprise',
            status: 'Grace',
            graceEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
            isOverdue: true,
            shopsCount: 5,
            usersCount: 15,
            ownerEmail: 'north@apexretail.com',
            createdAt: '2026-08-15T09:00:00Z',
          },
          {
            tenantID: 4,
            id: '4',
            name: 'Metro Pharmacy',
            slug: 'metro-pharma',
            tier: 'Starter',
            status: 'Suspended',
            shopsCount: 1,
            usersCount: 1,
            ownerEmail: 'metro@pharma.com',
            createdAt: '2026-07-10T12:00:00Z',
          },
        ];
      }
    },
  });

  const handleCopySlug = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    toast.success(`Copied slug: ${slug}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getStatusBadge = (status: string = 'Active', isOverdue = false) => {
    const s = status.toLowerCase();
    let badgeClass = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    let dotClass = 'bg-gray-400';
    let label = status;

    if (s === 'active') {
      badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      dotClass = 'bg-emerald-500';
      label = 'Active';
    } else if (s === 'trial') {
      badgeClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      dotClass = 'bg-blue-500 animate-pulse';
      label = 'Trial';
    } else if (s === 'grace') {
      badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      dotClass = 'bg-amber-500';
      label = 'Grace Period';
    } else if (s === 'suspended') {
      badgeClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      dotClass = 'bg-red-500';
      label = 'Suspended';
    } else if (s === 'blocked') {
      badgeClass = 'bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-500/30';
      dotClass = 'bg-rose-600';
      label = 'Blocked';
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          {label}
        </span>
        {isOverdue && (
          <span
            id="business-overdue-badge"
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase tracking-wider"
          >
            Overdue
          </span>
        )}
      </div>
    );
  };

  const getTierBadge = (tier: string = 'Starter') => {
    const t = tier.toLowerCase();
    if (t === 'enterprise') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25">
          Enterprise
        </span>
      );
    }
    if (t === 'pro') {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
          Pro
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        Starter
      </span>
    );
  };

  // Metrics summary
  const allBiz = businesses || [];
  const metrics = useMemo(() => {
    const total = allBiz.length;
    const active = allBiz.filter((b: any) => (b.status || '').toLowerCase() === 'active').length;
    const trialOrGrace = allBiz.filter((b: any) => {
      const s = (b.status || '').toLowerCase();
      return s === 'trial' || s === 'grace';
    }).length;
    const suspendedOrBlocked = allBiz.filter((b: any) => {
      const s = (b.status || '').toLowerCase();
      return s === 'suspended' || s === 'blocked';
    }).length;
    const totalShops = allBiz.reduce((acc: number, b: any) => acc + (b.shopsCount ?? b.shopCount ?? b.shops?.length ?? 1), 0);
    const totalUsers = allBiz.reduce((acc: number, b: any) => acc + (b.usersCount ?? b.userCount ?? b.users?.length ?? 1), 0);

    return { total, active, trialOrGrace, suspendedOrBlocked, totalShops, totalUsers };
  }, [allBiz]);

  // Filtering and Sorting
  const filteredBusinesses = useMemo(() => {
    const filtered = allBiz.filter((b: any) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.slug && b.slug.toLowerCase().includes(q)) ||
        String(b.tenantID || b.id || '').includes(q) ||
        (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q));

      const statusMatch =
        statusFilter === 'ALL' ||
        (b.status && b.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && statusMatch;
    });

    return filtered.sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'shops') {
        aVal = a.shopsCount ?? a.shopCount ?? a.shops?.length ?? 1;
        bVal = b.shopsCount ?? b.shopCount ?? b.shops?.length ?? 1;
      } else if (sortField === 'users') {
        aVal = a.usersCount ?? a.userCount ?? a.users?.length ?? 1;
        bVal = b.usersCount ?? b.userCount ?? b.users?.length ?? 1;
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal || '');
        return sortAsc ? cmp : -cmp;
      }
      if (typeof aVal === 'number') {
        return sortAsc ? aVal - (bVal || 0) : (bVal || 0) - aVal;
      }
      return 0;
    });
  }, [allBiz, searchTerm, statusFilter, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'All', count: metrics.total },
    { key: 'Active', label: 'Active', count: metrics.active },
    { key: 'Trial', label: 'Trial', count: allBiz.filter((b: any) => (b.status || '').toLowerCase() === 'trial').length },
    { key: 'Grace', label: 'Grace', count: allBiz.filter((b: any) => (b.status || '').toLowerCase() === 'grace').length },
    { key: 'Suspended', label: 'Suspended', count: allBiz.filter((b: any) => (b.status || '').toLowerCase() === 'suspended').length },
    { key: 'Blocked', label: 'Blocked', count: allBiz.filter((b: any) => (b.status || '').toLowerCase() === 'blocked').length },
  ];

  return (
    <div className="space-y-6 pb-12" id="platform-business-list-page">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Businesses & Tenants</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {metrics.total} Registered
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Provision, monitor subscriptions, inspect shop outlets, and manage multi-tenant access
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/platform/usage')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-btn border transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--bg-border)', color: 'var(--text-primary)' }}
          >
            <Activity className="w-4 h-4 text-indigo-500" />
            Usage Analytics
          </button>
          <button
            onClick={() => navigate('/platform/businesses/new')}
            id="btn-create-business"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-btn text-white transition-opacity hover:opacity-95 shadow-sm"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Plus className="w-4 h-4" />
            Create Business
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Total Businesses
          </span>
          <p className="text-2xl font-bold text-text-primary" id="kpi-total-businesses">
            {metrics.total}
          </p>
          <span className="text-[11px] text-muted">
            {metrics.totalShops} shops provisioned
          </span>
        </Card>

        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active Tenants
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" id="kpi-active-businesses">
            {metrics.active}
          </p>
          <span className="text-[11px] text-muted">
            {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% active subscription rate
          </span>
        </Card>

        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> In Trial / Grace
          </span>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" id="kpi-trial-grace-businesses">
            {metrics.trialOrGrace}
          </p>
          <span className="text-[11px] text-muted">
            Requires conversion follow-up
          </span>
        </Card>

        <Card className="p-4 shadow-card border space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Suspended / Blocked
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400" id="kpi-suspended-businesses">
            {metrics.suspendedOrBlocked}
          </p>
          <span className="text-[11px] text-muted">
            Overdue or restricted tenants
          </span>
        </Card>
      </div>

      {/* Filter Tabs & Search Controls */}
      <Card
        className="p-3.5 sm:p-4 shadow-card border flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusTabs.map((tab) => {
            const isSelected = statusFilter.toLowerCase() === tab.key.toLowerCase();
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:text-text-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-text-muted'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Result Count */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t" style={{ borderColor: 'var(--bg-border)' }}>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name, slug, #ID or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
              id="input-business-search"
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

          <div className="flex items-center justify-between w-full sm:w-auto gap-4 text-xs text-muted">
            <span>
              Showing <strong>{filteredBusinesses.length}</strong> of <strong>{metrics.total}</strong> accounts
            </span>
          </div>
        </div>
      </Card>

      {/* Desktop View: Modern High-Density Table */}
      <div className="hidden md:block">
        <Card
          className="shadow-card border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm" id="platform-business-table">
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
                    <div className="flex items-center gap-1.5">Business & Slug <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1.5">Status <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5">Trial / Grace Expiry</th>
                  <th className="px-4 py-3.5 text-center cursor-pointer" onClick={() => handleSort('shops')}>
                    <div className="flex items-center justify-center gap-1.5">Shops <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5 text-center cursor-pointer" onClick={() => handleSort('users')}>
                    <div className="flex items-center justify-center gap-1.5">Users <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort('createdAt')}>
                    <div className="flex items-center gap-1.5">Created <ArrowUpDown className="w-3 h-3 text-muted" /></div>
                  </th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : filteredBusinesses.length > 0 ? (
                  filteredBusinesses.map((b: any) => {
                    const endsDate = b.graceEndsAt || b.trialEndsAt;
                    const tenantId = b.tenantID || b.id || b.slug;
                    return (
                      <tr
                        key={tenantId}
                        onClick={() => navigate(`/platform/businesses/${tenantId}`)}
                        className="hover:bg-[var(--bg-app)] cursor-pointer transition-colors"
                      >
                        {/* Name + Disambiguation + Slug Copy */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text-primary">{b.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-muted">
                              #{tenantId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-xs text-muted">/{b.slug}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopySlug(e, b.slug)}
                              title="Copy Tenant Slug"
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-muted hover:text-text-primary transition-colors"
                            >
                              {copiedSlug === b.slug ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {b.ownerEmail && (
                              <span className="text-[11px] text-muted hidden lg:inline">
                                · {b.ownerEmail}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tier */}
                        <td className="px-4 py-3.5">{getTierBadge(b.tier)}</td>

                        {/* Status */}
                        <td className="px-4 py-3.5">{getStatusBadge(b.status, b.isOverdue)}</td>

                        {/* Trial/Grace Expiry */}
                        <td className="px-4 py-3.5 font-mono text-xs text-muted">
                          {endsDate ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted" />
                              {new Date(endsDate).toLocaleDateString()}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Shops */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {b.shopsCount ?? b.shopCount ?? b.shops?.length ?? 1}
                          </span>
                        </td>

                        {/* Users */}
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                            {b.usersCount ?? b.userCount ?? b.users?.length ?? 1}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3.5 font-mono text-xs text-muted">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/platform/usage/${tenantId}`)}
                            title="View Database Usage"
                            className="p-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-muted hover:text-text-primary transition-colors inline-flex items-center"
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/platform/businesses/${tenantId}`)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-colors inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Manage</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-xs text-muted">
                      No businesses found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Card List View: Optimized for Responsive Handheld Use */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        ) : filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((b: any) => {
            const endsDate = b.graceEndsAt || b.trialEndsAt;
            const tenantId = b.tenantID || b.id || b.slug;
            return (
              <Card
                key={tenantId}
                className="p-4 shadow-card border space-y-3"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
                onClick={() => navigate(`/platform/businesses/${tenantId}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-text-primary text-sm">{b.name}</h3>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-muted">
                        #{tenantId}
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
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(b.status, b.isOverdue)}
                    {getTierBadge(b.tier)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--bg-border)' }}>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Shops</span>
                    <span className="font-semibold">{b.shopsCount ?? b.shopCount ?? b.shops?.length ?? 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Users</span>
                    <span className="font-semibold">{b.usersCount ?? b.userCount ?? b.users?.length ?? 1}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Expires</span>
                    <span className="font-mono text-[11px] text-muted">
                      {endsDate ? new Date(endsDate).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--bg-border)' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/platform/usage/${tenantId}`)}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-primary inline-flex items-center gap-1"
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-500" />
                    Usage
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/platform/businesses/${tenantId}`)}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold bg-primary text-white hover:opacity-95 inline-flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-muted">
            No businesses found matching filters.
          </div>
        )}
      </div>
    </div>
  );
};
