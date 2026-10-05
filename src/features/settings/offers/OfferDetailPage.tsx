import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { phase11Api, Offer } from '../../../api/phase11';

export const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: offer, isLoading } = useQuery<Offer>({
    queryKey: ['offer', id],
    queryFn: () => phase11Api.getOffer(id!),
  });

  const sendMutation = useMutation({
    mutationFn: () => phase11Api.sendOffer(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['offer', id], updated);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Offer campaign sent to all recipients!');
    },
    onError: () => {
      toast.error('Failed to send offer');
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => phase11Api.retryOfferFailed(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['offer', id], updated);
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Retrying failed messages...');
    },
    onError: () => {
      toast.error('Failed to retry offer');
    },
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-muted">Offer not found.</p>
        <Link to="/settings/offers" className="text-primary hover:underline font-semibold mt-2 inline-block">
          Back to Offers
        </Link>
      </div>
    );
  }

  const recipients = (offer.recipients || []).filter(
    (r) => !statusFilter || r.status.toLowerCase() === statusFilter.toLowerCase()
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/settings/offers"
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to offers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary" id="offer-title-header" data-testid="offer-title-header">
                {offer.title}
              </h1>
              <span
                id="offer-detail-status"
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  offer.status === 'Sent'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : offer.status === 'Partial'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {offer.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5" id="offer-detail-created">
              Created on {new Date(offer.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offer.status === 'Draft' && (
            <Button
              id="offer-send-now-btn"
              onClick={() => sendMutation.mutate()}
              isLoading={sendMutation.isPending}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send Now
            </Button>
          )}

          {offer.status === 'Partial' && (
            <Button
              id="offer-retry-failed-btn"
              variant="outline"
              onClick={() => retryMutation.mutate()}
              isLoading={retryMutation.isPending}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Retry Failed
            </Button>
          )}
        </div>
      </div>

      {/* Message Body Card */}
      <Card className="border-border shadow-card p-5 space-y-2" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Broadcast Message Preview
        </h4>
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-border text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
          {offer.body}
        </div>
      </Card>

      {/* Recipients Section */}
      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            Recipients ({offer.totalRecipients})
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-border rounded-button focus:border-primary focus:outline-none"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            >
              <option value="">All Statuses</option>
              <option value="Sent">Sent</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {recipients.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No recipients found matching current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="offer-recipients-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Sent At</th>
                  <th className="px-4 py-3">Error / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recipients.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-text-primary">
                      {r.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-text-muted">
                      {r.phone}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'Sent'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : r.status === 'Failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {r.status === 'Sent' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : r.status === 'Failed' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate">
                      {r.error || '—'}
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
