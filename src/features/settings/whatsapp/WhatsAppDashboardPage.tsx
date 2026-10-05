import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Eye,
  Sliders,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuthStore, isBusinessAdmin } from '../../../stores/auth.store';
import { useAccessibleShops } from '../../../hooks/useAccessibleShops';
import { whatsappApi, WhatsAppUsage, WhatsAppMessage } from '../../../api/whatsapp';
import { SendMessageModal } from './SendMessageModal';

export const WhatsAppDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = isBusinessAdmin(user);
  const { shops, defaultShop } = useAccessibleShops();
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  useEffect(() => {
    if (defaultShop?.id && !selectedShopId) {
      setSelectedShopId(defaultShop.id);
    } else if (shops[0]?.id && !selectedShopId) {
      setSelectedShopId(shops[0].id);
    }
  }, [defaultShop, shops, selectedShopId]);

  const currentShopId = selectedShopId || defaultShop?.id || shops[0]?.id || 's1';

  const [usage, setUsage] = useState<WhatsAppUsage>({
    sentThisMonth: 0,
    monthlyLimit: 1000,
    allTimeSent: 0,
    failedCount: 0,
  });
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);

  const fetchData = async () => {
    if (!currentShopId) return;
    setLoading(true);
    try {
      const [u, msgs] = await Promise.all([
        whatsappApi.getUsage(currentShopId),
        whatsappApi.getMessages({
          shopId: currentShopId,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
      ]);
      setUsage(u);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentShopId, statusFilter]);

  if (!isAdmin && user?.role !== 'Manager') {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h2 className="text-lg font-bold">Access Denied</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          You do not have permission to view the WhatsApp dashboard.
        </p>
      </div>
    );
  }

  const limit = usage.monthlyLimit || 1000;
  const used = usage.sentThisMonth;
  const percent = Math.min(Math.round((used / limit) * 100), 100);

  const isRed = used >= 1000;
  const isAmber = used >= 900 && !isRed;

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.recipient.toLowerCase().includes(q) ||
      (m.templateName && m.templateName.toLowerCase().includes(q)) ||
      m.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="WhatsApp Messaging Dashboard"
        subtitle="Track monthly quota usage, message delivery states, and broadcast communications."
        showBack
        backTo="/settings"
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings/whatsapp')}
              className="text-xs"
            >
              <Sliders className="w-3.5 h-3.5 mr-1" />
              API Config
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setSendModalOpen(true)}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Send Message
            </Button>
          </div>
        }
      />

      {/* Shop Selector */}
      {isAdmin && shops.length > 1 && (
        <div className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Shop Context</span>
          <select
            value={currentShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="px-3 py-1 text-xs rounded-input border font-medium focus:ring-2 focus:ring-primary focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--bg-border)',
              color: 'var(--text-primary)',
            }}
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Sent Card with Progress Bar */}
        <Card className="p-5 border shadow-xs space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Sent This Month
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isRed
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                  : isAmber
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {used} / {limit}
            </span>
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold tracking-tight">{used}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              / {limit} limit
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isRed ? 'bg-red-600' : isAmber ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>{percent}% allocated</span>
              {isRed ? (
                <span className="text-red-600 font-semibold">Limit Exceeded</span>
              ) : isAmber ? (
                <span className="text-amber-600 font-semibold">Near Quota</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Healthy</span>
              )}
            </div>
          </div>
        </Card>

        {/* All-Time Sent Card */}
        <Card className="p-5 border shadow-xs space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              All Time Sent
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold tracking-tight">{usage.allTimeSent.toLocaleString()}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>messages</span>
          </div>

          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Cumulative messages dispatched across all campaigns & receipts.
          </p>
        </Card>

        {/* Failed Count Card */}
        <Card className="p-5 border shadow-xs space-y-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Failed Count
            </span>
            <AlertCircle className={`w-4 h-4 ${usage.failedCount > 0 ? 'text-danger' : 'text-zinc-400'}`} />
          </div>

          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold tracking-tight ${usage.failedCount > 0 ? 'text-danger' : ''}`}>
              {usage.failedCount}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>undelivered</span>
          </div>

          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Delivery errors from invalid numbers or Meta policy blocks.
          </p>
        </Card>
      </div>

      {/* Messages Section */}
      <Card className="shadow-card border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}>
        <div
          className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)' }}
        >
          <div>
            <h3 className="text-sm font-bold tracking-tight">Recent Dispatched Messages</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {filteredMessages.length} recorded communications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search recipient / content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-input border focus:ring-2 focus:ring-primary focus:outline-none w-48 sm:w-56"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-input border font-medium focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
            </select>

            {/* Refresh */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchData}
              isLoading={loading}
              className="text-xs px-2.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages Table */}
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
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Template</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Sent At</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <tr
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-semibold font-mono">{msg.recipient}</td>
                    <td className="px-5 py-3 capitalize">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium border" style={{ borderColor: 'var(--bg-border)', backgroundColor: 'var(--bg-app)' }}>
                        {msg.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {msg.templateName || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          msg.status === 'read'
                            ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : msg.status === 'delivered'
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : msg.status === 'failed'
                            ? 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {msg.status === 'read' && <CheckCircle2 className="w-3 h-3" />}
                        {msg.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                        {msg.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                        {msg.status === 'sent' && <Clock className="w-3 h-3" />}
                        <span className="capitalize">{msg.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.sentAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(msg);
                        }}
                        className="text-[11px] py-1 px-2"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No messages match the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Send Message Modal */}
      <SendMessageModal
        open={sendModalOpen}
        onClose={() => setSendModalOpen(false)}
        shopId={currentShopId}
        onSuccess={fetchData}
      />

      {/* Message Detail Modal */}
      <Modal
        open={!!selectedMessage}
        title="WhatsApp Message Details"
        onClose={() => setSelectedMessage(null)}
        footer={
          <Button variant="secondary" onClick={() => setSelectedMessage(null)}>
            Close
          </Button>
        }
      >
        {selectedMessage && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b" style={{ borderColor: 'var(--bg-border)' }}>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Recipient Phone</p>
                <p className="font-bold font-mono text-sm mt-0.5">{selectedMessage.recipient}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Status</p>
                <p className="font-semibold capitalize mt-0.5">{selectedMessage.status}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Message Type</p>
                <p className="font-semibold capitalize mt-0.5">{selectedMessage.type}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }}>Template</p>
                <p className="font-mono mt-0.5">{selectedMessage.templateName || 'None'}</p>
              </div>
              <div className="col-span-2">
                <p style={{ color: 'var(--text-muted)' }}>Sent At</p>
                <p className="font-mono mt-0.5">{new Date(selectedMessage.sentAt).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                Payload Content
              </p>
              <div
                className="p-3 rounded-lg border font-mono text-xs whitespace-pre-wrap leading-relaxed"
                style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)' }}
              >
                {selectedMessage.content}
              </div>
            </div>

            {selectedMessage.error && (
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-danger space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Meta Error Response
                </p>
                <p>{selectedMessage.error}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
