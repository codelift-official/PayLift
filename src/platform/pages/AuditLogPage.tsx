import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export const AuditLogPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('ALL');
  const [tenantSearch, setTenantSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['platform', 'audit-logs'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/audit-logs');
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.logs || [];
    },
  });

  const filteredLogs = (logs || []).filter((log: any) => {
    // Action filter
    const matchesAction =
      actionFilter === 'ALL' ||
      (log.action && log.action.toLowerCase() === actionFilter.toLowerCase());

    // Tenant search
    const tenantText = (log.targetTenant || log.tenantSlug || log.businessName || '').toLowerCase();
    const matchesTenant =
      tenantSearch === '' || tenantText.includes(tenantSearch.toLowerCase());

    // Date range
    const logTime = log.timestamp || log.time || log.createdAt;
    let matchesDate = true;
    if (logTime) {
      const d = new Date(logTime);
      if (startDate) {
        matchesDate = matchesDate && d >= new Date(startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && d <= new Date(endDate + 'T23:59:59');
      }
    }

    return matchesAction && matchesTenant && matchesDate;
  });

  // Extract unique actions for dropdown
  const uniqueActions = Array.from(
    new Set((logs || []).map((l: any) => l.action).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Security Audit Log</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Tamper-evident administrative action history across all tenants
          </p>
        </div>
      </div>

      {/* Filters: action type, tenant, date range */}
      <Card
        className="p-4 shadow-card border flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        {/* Tenant Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Filter by tenant..."
            value={tenantSearch}
            onChange={(e) => setTenantSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Action Type Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-input border focus:ring-2 focus:ring-primary focus:outline-none font-medium"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map((act: any) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range: From / To */}
        <div className="flex items-center space-x-2 text-xs">
          <Calendar className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 rounded-input border focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </Card>

      {/* Table: Time | Admin | Action | Target Tenant | IP */}
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
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Admin</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Target Tenant</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log: any, idx: number) => {
                  const logTime = log.timestamp || log.time || log.createdAt;
                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-[var(--bg-app)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {logTime ? new Date(logTime).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {log.admin || log.adminEmail || log.performedBy || 'System'}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-indigo-500">
                        {log.action}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>
                        {log.targetTenant || log.tenantSlug || log.businessName || 'Platform'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {log.ip || log.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No audit log entries matching filters.
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
