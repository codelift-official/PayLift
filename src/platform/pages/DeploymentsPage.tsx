import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { platformApiClient } from '../api/client';

export const DeploymentsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'deployments', page, pageSize],
    queryFn: async () => {
      const res = await platformApiClient.get(
        `/platform/deployments?page=${page}&pageSize=${pageSize}`
      );
      return res.data;
    },
  });

  const deployments = Array.isArray(data) ? data : data?.items || data?.deployments || [];
  const total = typeof data?.total === 'number' ? data.total : deployments.length;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Deployments</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Track release versions, git commits, and environment rollouts
          </p>
        </div>
      </div>

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
                <th className="px-5 py-3.5">Version</th>
                <th className="px-5 py-3.5">GitSha</th>
                <th className="px-5 py-3.5">Environment</th>
                <th className="px-5 py-3.5">DeployedAt</th>
                <th className="px-5 py-3.5">DeployedBy</th>
                <th className="px-5 py-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : deployments.length > 0 ? (
                deployments.map((dep: any, idx: number) => (
                  <tr
                    key={dep.id || idx}
                    className="hover:bg-[var(--bg-app)] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                      v{dep.version || '1.0.0'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-indigo-500">
                      {dep.gitSha?.slice(0, 7) || '9f2de70'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {dep.environment || 'Production'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {dep.deployedAt ? new Date(dep.deployedAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>
                      {dep.deployedBy || 'GitHub Actions'}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>
                      {dep.notes || 'Automated release pipeline deployment'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No deployment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="px-5 py-3.5 border-t flex items-center justify-between text-xs"
          style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border enabled:hover:opacity-80 disabled:opacity-40 transition-opacity"
              style={{
                borderColor: 'var(--bg-border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-md border enabled:hover:opacity-80 disabled:opacity-40 transition-opacity"
              style={{
                borderColor: 'var(--bg-border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
