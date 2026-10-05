import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Filter, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { platformApiClient } from '../api/client';

export const SupportTicketsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['platform', 'support-tickets'],
    queryFn: async () => {
      const res = await platformApiClient.get('/platform/support-tickets');
      return Array.isArray(res.data) ? res.data : res.data?.items || res.data?.tickets || [];
    },
  });

  const handleStatusChange = async (ticketId: string | number, newStatus: 'Open' | 'Closed') => {
    setUpdating(true);
    try {
      await platformApiClient.patch(`/platform/support-tickets/${ticketId}/status`, {
        status: newStatus,
      });
      toast.success(`Ticket marked as ${newStatus}`);
      setSelectedTicket((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      refetch();
    } catch {
      toast.error('Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = (tickets || []).filter((t: any) => {
    const matchesEmail =
      emailSearch === '' ||
      (t.email && t.email.toLowerCase().includes(emailSearch.toLowerCase())) ||
      (t.name && t.name.toLowerCase().includes(emailSearch.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (t.status && t.status.toLowerCase() === statusFilter.toLowerCase());

    return matchesEmail && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Review inquiries submitted from customer contact forms
          </p>
        </div>
      </div>

      {/* Filters: Status, email search */}
      <Card
        className="p-4 shadow-card border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--bg-border)' }}
      >
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search email or name..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
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
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </Card>

      {/* Table: Created | Name | Email | Subject | Status */}
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
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Subject</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--bg-border)' }}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((t: any) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="hover:bg-[var(--bg-app)] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.createdAt || t.created ? new Date(t.createdAt || t.created).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {t.name}
                    </td>
                    <td className="px-5 py-3.5" style={{ color: 'var(--text-muted)' }}>
                      {t.email}
                    </td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {t.subject}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          t.status?.toLowerCase() === 'closed'
                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {t.status || 'Open'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          title={selectedTicket.subject || 'Support Ticket'}
          onClose={() => setSelectedTicket(null)}
          footer={
            <>
              {selectedTicket.status?.toLowerCase() === 'closed' ? (
                <Button
                  variant="secondary"
                  className="text-xs flex items-center space-x-1.5"
                  onClick={() => handleStatusChange(selectedTicket.id, 'Open')}
                  isLoading={updating}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen</span>
                </Button>
              ) : (
                <Button
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1.5"
                  onClick={() => handleStatusChange(selectedTicket.id, 'Closed')}
                  isLoading={updating}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Closed</span>
                </Button>
              )}
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => setSelectedTicket(null)}
              >
                Close
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div
              className="p-3.5 rounded-lg border space-y-1.5 text-xs"
              style={{ backgroundColor: 'var(--bg-app)', borderColor: 'var(--bg-border)' }}
            >
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>From:</span>
                <span className="font-semibold">{selectedTicket.name} ({selectedTicket.email})</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <span className="font-mono">
                  {selectedTicket.createdAt || selectedTicket.created
                    ? new Date(selectedTicket.createdAt || selectedTicket.created).toLocaleString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="font-semibold">{selectedTicket.status || 'Open'}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Message
              </p>
              <div
                className="p-4 rounded-lg border text-sm whitespace-pre-wrap leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--bg-border)',
                  color: 'var(--text-primary)',
                }}
              >
                {selectedTicket.message || selectedTicket.body || 'No message content provided.'}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
