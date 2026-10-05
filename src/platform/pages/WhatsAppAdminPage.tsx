import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Ban,
  Building2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { whatsappApi, PlatformWhatsAppTenant, WhatsAppMessage } from '../../api/whatsapp';

export const WhatsAppAdminPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Modals
  const [messagesModalShop, setMessagesModalShop] = useState<PlatformWhatsAppTenant | null>(null);
  const [shopMessages, setShopMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [disableModalShop, setDisableModalShop] = useState<PlatformWhatsAppTenant | null>(null);
  const [disabling, setDisabling] = useState(false);

  const {
    data: tenants = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['platform', 'whatsapp', 'tenants'],
    queryFn: () => whatsappApi.getPlatformTenants(),
  });

  const handleOpenMessages = async (t: PlatformWhatsAppTenant) => {
    setMessagesModalShop(t);
    setLoadingMessages(true);
    try {
      const msgs = await whatsappApi.getMessages({ shopId: t.shopId });
      setShopMessages(msgs);
    } catch (err) {
      console.error('Failed to load shop messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleDisableShop = async () => {
    if (!disableModalShop) return;
    setDisabling(true);
    try {
      await whatsappApi.disablePlatformShop(disableModalShop.shopId);
      toast.success(`WhatsApp disabled for ${disableModalShop.shopName}`);
      setDisableModalShop(null);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable shop WhatsApp');
    } finally {
      setDisabling(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter === 'active' && !t.isActive) return false;
    if (statusFilter === 'disabled' && t.isActive) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.tenantName.toLowerCase().includes(q) ||
      t.shopName.toLowerCase().includes(q) ||
      t.phoneNumberId.toLowerCase().includes(q)
    );
  });

  const totalMonthlySent = tenants.reduce((acc, t) => acc + (t.sentThisMonth || 0), 0);
  const totalAllTime = tenants.reduce((acc, t) => acc + (t.allTimeSent || 0), 0);
  const activeTenantsCount = tenants.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Business Platform Admin</h1>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Global Meta Cloud API tenant integration monitoring & quota governance
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          isLoading={isLoading}
          className="text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Active Integrated Shops
          </span>
          <p className="text-2xl font-extrabold">{activeTenantsCount} / {tenants.length}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Connected WhatsApp Business endpoints</p>
        </Card>

        <Card className="p-5 border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Platform Sent This Month
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {totalMonthlySent.toLocaleString()}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Across all tenant accounts</p>
        </Card>

        <Card className="p-5 border shadow-card space-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Cumulative All-Time Dispatches
          </span>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {totalAllTime.toLocaleString()}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Platform aggregate volume</p>
        </Card>
      </div>

      {/* Tenant WhatsApp Table Card */}
      <Card className="shadow-card border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <div
          className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider flex items-center" style={{ color: 'var(--text-muted)' }}>
            <Building2 className="w-4 h-4 mr-1.5 text-indigo-500" />
            Tenant Usage Registry
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search tenant or shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-input border focus:ring-2 focus:ring-primary focus:outline-none w-48 sm:w-60"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-input border font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="disabled">Disabled Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className="border-b uppercase font-bold text-[11px]"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-muted)',
              }}
            >
              <tr>
                <th className="px-5 py-3">Tenant & Shop</th>
                <th className="px-5 py-3">Phone Number ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Month Usage</th>
                <th className="px-5 py-3">All Time</th>
                <th className="px-5 py-3">Failed</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((t) => {
                  const isOverQuota = t.sentThisMonth >= t.monthlyLimit;
                  const isNearQuota = t.sentThisMonth >= 900 && !isOverQuota;

                  return (
                    <tr key={t.shopId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-sm">{t.tenantName}</p>
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {t.shopName} · ID: {t.shopId}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {t.phoneNumberId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            t.isActive
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {t.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-zinc-400" /> Disabled
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span
                          className={`font-semibold ${
                            isOverQuota
                              ? 'text-danger font-bold'
                              : isNearQuota
                              ? 'text-amber-600 font-bold'
                              : ''
                          }`}
                        >
                          {t.sentThisMonth}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}> / {t.monthlyLimit}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-medium">
                        {t.allTimeSent.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 font-mono">
                        <span className={t.failedCount > 0 ? 'text-danger font-semibold' : ''}>
                          {t.failedCount}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenMessages(t)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Messages
                        </Button>

                        {t.isActive && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setDisableModalShop(t)}
                            className="text-[11px] py-1 px-2.5"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Disable Shop
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No tenant WhatsApp accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Messages Modal */}
      <Modal
        open={!!messagesModalShop}
        title={`WhatsApp Messages — ${messagesModalShop?.shopName || 'Shop'}`}
        onClose={() => setMessagesModalShop(null)}
        footer={
          <Button variant="secondary" onClick={() => setMessagesModalShop(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {loadingMessages ? (
            <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              Loading recorded messages...
            </p>
          ) : shopMessages.length > 0 ? (
            <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {shopMessages.map((m) => (
                <div key={m.id} className="py-2.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold font-mono">{m.recipient}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.status === 'read'
                          ? 'bg-indigo-500/10 text-indigo-500'
                          : m.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : m.status === 'failed'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {m.content}
                  </p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {new Date(m.sentAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              No messages recorded for this shop.
            </p>
          )}
        </div>
      </Modal>

      {/* Disable Shop Confirmation Modal */}
      <Modal
        open={!!disableModalShop}
        title="Disable WhatsApp Business for Shop?"
        onClose={() => setDisableModalShop(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisableModalShop(null)} disabled={disabling}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDisableShop}
              isLoading={disabling}
            >
              Confirm Disable
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <p>
            Are you sure you want to disable WhatsApp Business for <strong>{disableModalShop?.shopName}</strong> ({disableModalShop?.tenantName})?
          </p>
          <p className="text-danger font-medium">
            This will immediately prevent the tenant from dispatching digital receipts and template messages until re-enabled.
          </p>
        </div>
      </Modal>
    </div>
  );
};
