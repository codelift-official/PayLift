import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Copy,
  Check,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { phase11Api, PlatformErrorLogItem } from '../../api/phase11';

export const PlatformErrorLogPage: React.FC = () => {
  const [tenantFilter, setTenantFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedError, setSelectedError] = useState<PlatformErrorLogItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const { data: logs = [], isLoading } = useQuery<PlatformErrorLogItem[]>({
    queryKey: ['platformErrorLogs', tenantFilter, statusFilter],
    queryFn: () =>
      phase11Api.getPlatformErrorLogs({
        tenant: tenantFilter.trim() || undefined,
        status: statusFilter ? parseInt(statusFilter) : undefined,
      }),
  });

  const handleCopy = (correlationID: string) => {
    navigator.clipboard.writeText(correlationID);
    setCopiedId(true);
    toast.success('Correlation ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">System Error Logs</h1>
        <p className="text-sm text-text-muted mt-1">
          Real-time incident traces, API exception telemetry, and correlation IDs for distributed debugging
        </p>
      </div>

      {/* Filters Bar */}
      <Card className="border-border shadow-card p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <Input
                id="error-log-tenant-filter"
                className="pl-9"
                placeholder="Filter by tenant slug or ID..."
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <select
              id="error-log-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All HTTP Statuses</option>
              <option value="500">500 Internal Server Error</option>
              <option value="404">404 Not Found</option>
              <option value="429">429 Rate Limit Exceeded</option>
              <option value="400">400 Bad Request</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Logs Table */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            No error logs found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="platform-error-log-table" data-testid="platform-error-log-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Path</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Correlation</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((err) => (
                  <tr
                    key={err.id}
                    onClick={() => setSelectedError(err)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group error-log-row"
                  >
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(err.time).toLocaleTimeString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          err.status >= 500
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {err.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono font-medium text-text-primary">
                      {err.path}
                    </td>

                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {err.tenant}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-text-muted truncate max-w-xs">
                      {err.correlationID}
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

      {/* Error Detail Modal with Stack Trace */}
      {selectedError && (
        <Modal
          open={Boolean(selectedError)}
          onClose={() => setSelectedError(null)}
          title={`Error Incident Details [HTTP ${selectedError.status}]`}
        >
          <div className="space-y-4 py-2" id="error-detail-modal-body">
            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border">
              <div>
                <span className="text-text-muted block">Endpoint:</span>
                <span className="font-mono font-bold text-text-primary">{selectedError.path}</span>
              </div>
              <div>
                <span className="text-text-muted block">Tenant:</span>
                <span className="font-semibold text-text-primary">{selectedError.tenant}</span>
              </div>
              <div>
                <span className="text-text-muted block">Timestamp:</span>
                <span className="text-text-primary">{new Date(selectedError.time).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-text-muted block">Status:</span>
                <span className="font-bold text-danger">HTTP {selectedError.status}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-text-muted uppercase">Correlation ID</span>
                <Button
                  id="copy-correlation-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(selectedError.correlationID)}
                  className="h-7 text-xs"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 mr-1 text-success" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy correlationID
                </Button>
              </div>
              <div className="p-2.5 rounded font-mono text-xs bg-slate-900 text-slate-100 select-all break-all" id="modal-correlation-id">
                {selectedError.correlationID}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-text-muted uppercase block mb-1">Stack Trace</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-red-300 font-mono text-[11px] overflow-x-auto max-h-60 whitespace-pre-wrap leading-relaxed border border-red-950">
                {selectedError.stackTrace}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedError(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
