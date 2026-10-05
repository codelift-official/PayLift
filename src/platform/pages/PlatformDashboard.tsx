import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  GitBranch,
  LifeBuoy,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export const PlatformDashboard: React.FC = () => {
  // 1. Metrics query
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['platform', 'metrics'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/metrics');
      const d = res.data || {};
      return {
        totalBusinesses: d.totalBusinesses ?? d.TotalBusinesses ?? 0,
        active: d.active ?? d.Active ?? 0,
        trialOrGrace: d.trialOrGrace ?? d.TrialOrGrace ?? (d.trial ?? 0) + (d.grace ?? 0),
        suspended: d.suspended ?? d.Suspended ?? 0,
      };
    },
  });

  // 2. Last 5 deployments
  const { data: deployments } = useQuery({
    queryKey: ['platform', 'deployments', 'recent'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/deployments?page=1&pageSize=5');
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.deployments || [];
    },
  });

  // 3. Last 5 open support tickets
  const { data: supportTickets } = useQuery({
    queryKey: ['platform', 'support-tickets', 'recent'],
    queryFn: async () => {
      const res = await platformApiClient.get(
        '/platform/support-tickets?status=Open&page=1&pageSize=5'
      );
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.tickets || [];
    },
  });

  // 4. Last 10 audit log entries
  const { data: auditLogs } = useQuery({
    queryKey: ['platform', 'audit-logs', 'recent'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/audit-logs?page=1&pageSize=10');
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.logs || [];
    },
  });

  return (
    <div className="space-y-8">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Businesses */}
        <Card
          className="p-5 shadow-card border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Total Businesses
            </p>
            <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {metricsLoading ? '—' : metrics?.totalBusinesses ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Active */}
        <Card
          className="p-5 shadow-card border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Active
            </p>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metricsLoading ? '—' : metrics?.active ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Trial or Grace */}
        <Card
          className="p-5 shadow-card border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Trial or Grace
            </p>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {metricsLoading ? '—' : metrics?.trialOrGrace ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        {/* Suspended */}
        <Card
          className="p-5 shadow-card border flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Suspended
            </p>
            <p className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
              {metricsLoading ? '—' : metrics?.suspended ?? 0}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Grid of Recent Sections: Deployments & Support Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last 5 Deployments */}
        <Card
          className="shadow-card border overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
          >
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Recent Deployments
              </h2>
            </div>
            <Link
              to="/platform/deployments"
              className="text-xs font-semibold text-indigo-500 hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y flex-1" style={{ borderColor: 'var(--bg-border)' }}>
            {deployments && deployments.length > 0 ? (
              deployments.slice(0, 5).map((dep: any, idx: number) => (
                <div key={dep.id || idx} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      v{dep.version || '1.0.0'}{' '}
                      <span className="font-mono text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                        ({dep.gitSha?.slice(0, 7) || 'HEAD'})
                      </span>
                    </p>
                    <p style={{ color: 'var(--text-muted)' }}>
                      By {dep.deployedBy || 'CI/CD Pipeline'} · {dep.environment || 'Production'}
                    </p>
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {dep.deployedAt ? new Date(dep.deployedAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No recent deployment records.
              </div>
            )}
          </div>
        </Card>

        {/* Last 5 Open Support Tickets */}
        <Card
          className="shadow-card border overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
          >
            <div className="flex items-center space-x-2">
              <LifeBuoy className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Open Support Tickets
              </h2>
            </div>
            <Link
              to="/platform/support"
              className="text-xs font-semibold text-indigo-500 hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y flex-1" style={{ borderColor: 'var(--bg-border)' }}>
            {supportTickets && supportTickets.length > 0 ? (
              supportTickets.slice(0, 5).map((ticket: any, idx: number) => (
                <div key={ticket.id || idx} className="p-4 flex items-center justify-between text-xs">
                  <div className="truncate pr-3">
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {ticket.subject || 'Inquiry'}
                    </p>
                    <p className="truncate" style={{ color: 'var(--text-muted)' }}>
                      {ticket.name} ({ticket.email})
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                    {ticket.status || 'Open'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No open support tickets.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Last 10 Audit Log Entries */}
      <Card
        className="shadow-card border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Recent Audit Log
            </h2>
          </div>
          <Link
            to="/platform/audit"
            className="text-xs font-semibold text-indigo-500 hover:underline flex items-center space-x-1"
          >
            <span>View full audit log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)', color: 'var(--text-muted)' }}
            >
              <tr>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Target Tenant</th>
                <th className="px-5 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {auditLogs && auditLogs.length > 0 ? (
                auditLogs.slice(0, 10).map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-[var(--bg-app)] transition-colors">
                    <td className="px-5 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.timestamp || log.time || log.createdAt ? new Date(log.timestamp || log.time || log.createdAt).toLocaleString() : 'Just now'}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {log.admin || log.adminEmail || log.performedBy || 'System'}
                    </td>
                    <td className="px-5 py-3 font-mono text-indigo-500 font-semibold">
                      {log.action || log.eventType || 'CONFIG_CHANGE'}
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--text-muted)' }}>
                      {log.targetTenant || log.tenantSlug || log.businessName || '—'}
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {log.ip || log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No audit records logged yet.
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
