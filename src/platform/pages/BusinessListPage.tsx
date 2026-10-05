import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Filter, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export const BusinessListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['platform', 'businesses'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/businesses');
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.businesses || [];
    },
  });

  const getStatusBadge = (status: string = 'Active') => {
    const s = status.toLowerCase();
    if (s === 'trial') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Trial
        </span>
      );
    }
    if (s === 'active') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Active
        </span>
      );
    }
    if (s === 'grace') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Grace
        </span>
      );
    }
    if (s === 'suspended') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          Suspended
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
        {status}
      </span>
    );
  };

  const filteredBusinesses = (businesses || []).filter((b: any) => {
    const matchesSearch =
      searchTerm === '' ||
      (b.name && b.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.slug && b.slug.toLowerCase().includes(searchTerm.toLowerCase()));

    const statusMatch =
      statusFilter === 'ALL' ||
      (b.status && b.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesSearch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Businesses</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Manage tenants, subscriptions, and shop configurations
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card
        className="p-4 shadow-card border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-medium"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Grace">Grace</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {/* Businesses Table */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5">Tier</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Trial/Grace Ends</th>
                <th className="px-5 py-3.5">Shops</th>
                <th className="px-5 py-3.5">Users</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredBusinesses.length > 0 ? (
                filteredBusinesses.map((b: any) => {
                  const endsDate = b.graceEndsAt || b.trialEndsAt;
                  return (
                    <tr
                      key={b.tenantID || b.id || b.slug}
                      className="hover:bg-[var(--bg-app)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {b.name}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {b.slug}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {b.tier || 'Starter'}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(b.status)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {endsDate ? new Date(endsDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5">{b.shopsCount ?? b.shopCount ?? b.shops?.length ?? 1}</td>
                      <td className="px-5 py-3.5">{b.usersCount ?? b.userCount ?? b.users?.length ?? 1}</td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/platform/businesses/${b.tenantID || b.id}`)}
                          className="px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-400 transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No businesses found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
