import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Megaphone, ChevronRight, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { phase11Api, Offer } from '../../../api/phase11';

export const OffersListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['offers'],
    queryFn: phase11Api.getOffers,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Promotional Offers & Broadcasts"
          subtitle="Send bulk WhatsApp promotional messages and track delivery metrics"
        />

        <Link to="/settings/offers/new">
          <Button size="sm" id="create-offer-btn">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Offer
          </Button>
        </Link>
      </div>

      <Card className="border-border shadow-card overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 text-center space-y-3" id="offers-empty-state">
            <Megaphone className="w-10 h-10 mx-auto text-text-muted" />
            <h4 className="font-bold text-sm text-text-primary">No offers yet.</h4>
            <p className="text-xs text-text-muted">
              Create your first promotional offer to send updates to your customers.
            </p>
            <Button
              size="sm"
              onClick={() => navigate('/settings/offers/new')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create your first offer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" id="offers-table">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Recipients</th>
                  <th className="px-4 py-3 text-center">Sent</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {offers.map((offer) => (
                  <tr
                    key={offer.id}
                    onClick={() => navigate(`/settings/offers/${offer.id}`)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group offer-row"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-text-primary block text-sm group-hover:text-primary transition-colors">
                        {offer.title}
                      </span>
                      <span className="text-[11px] text-text-muted line-clamp-1">
                        {offer.body}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          offer.status === 'Sent'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : offer.status === 'Partial'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-mono font-bold text-text-primary">
                      {offer.totalRecipients}
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-success font-bold">
                      {offer.sentCount}
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
