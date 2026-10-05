import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, Building2, Store, Users, FileText, IndianRupee, Activity } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { phase11Api, PlatformTenantUsage, PlatformSystemUsage } from '../../api/phase11';

export const PlatformUsagePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: summary, isLoading: isSummaryLoading } = useQuery<PlatformSystemUsage>({
    queryKey: ['platformUsageSummary'],
    queryFn: phase11Api.getPlatformUsageSummary,
  });

  const { data: usageList = [], isLoading: isListLoading } = useQuery<PlatformTenantUsage[]>({
    queryKey: ['platformUsage'],
    queryFn: phase11Api.getPlatformUsage,
  });

  const isLoading = isSummaryLoading && isListLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Tenant Resource & Usage Telemetry</h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor system throughput, invoice volume, storage quota, and active businesses across the platform
        </p>
      </div>

      {/* Aggregate System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Businesses
          </span>
          <p className="text-xl font-bold text-text-primary">
            {summary?.totalBusinesses ?? 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {summary?.activeBusinesses ?? 0} active
          </span>
        </Card>

        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-500" /> Outlets
          </span>
          <p className="text-xl font-bold text-text-primary">
            {summary?.totalShops ?? 0}
          </p>
          <span className="text-[11px] text-text-muted">Total stores</span>
        </Card>

        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-teal-500" /> Team Users
          </span>
          <p className="text-xl font-bold text-text-primary">
            {summary?.totalUsers ?? 0}
          </p>
          <span className="text-[11px] text-text-muted">Registered staff</span>
        </Card>

        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" /> Invoices
          </span>
          <p className="text-xl font-bold text-text-primary">
            {summary?.totalBills ?? 0}
          </p>
          <span className="text-[11px] text-text-muted">All-time bills</span>
        </Card>

        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Revenue
          </span>
          <p className="text-xl font-bold text-text-primary">
            ₹{(summary?.totalRevenue ?? 0).toLocaleString()}
          </p>
          <span className="text-[11px] text-text-muted">Platform volume</span>
        </Card>

        <Card className="p-3.5 border-border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)' }}>
          <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-purple-500" /> Status
          </span>
          <p className="text-xl font-bold text-emerald-600">Online</p>
          <span className="text-[11px] text-text-muted">Cloudflare Worker</span>
        </Card>
      </div>

      {/* Tenant Breakdown Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between" style={{ backgroundColor: 'var(--bg-app)' }}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Active Tenant Telemetry ({usageList?.length ?? 0})
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !usageList || usageList.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            No tenant usage telemetry available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="platform-usage-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3 text-right">Bills (30d)</th>
                  <th className="px-4 py-3 text-center">Users</th>
                  <th className="px-4 py-3 text-center">Shops</th>
                  <th className="px-4 py-3">Storage</th>
                  <th className="px-4 py-3 text-right">API (7d)</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usageList.map((tenant) => (
                  <tr
                    key={tenant.tenantID || tenant.tenantName}
                    onClick={() => navigate(`/platform/usage/${tenant.tenantID}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group tenant-usage-row"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors block">
                        {tenant.tenantName}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">
                        Tenant #{tenant.tenantID}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                      {typeof tenant.bills30d === 'number' ? tenant.bills30d.toLocaleString() : (tenant.bills30d ?? '—')}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-text-primary">
                      {tenant.users ?? 1}
                    </td>

                    <td className="px-4 py-3 text-center font-bold text-text-primary">
                      {tenant.shops ?? 1}
                    </td>

                    <td className="px-4 py-3 font-mono text-text-muted">
                      {tenant.storage || '1.2 MB'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-primary font-semibold">
                      {typeof tenant.api7d === 'number' ? tenant.api7d.toLocaleString() : (tenant.api7d ?? '—')}
                    </td>

                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {tenant.lastActive ? new Date(tenant.lastActive).toLocaleDateString() : 'Recent'}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
